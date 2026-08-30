/**
 * De taakverwerker. Draait in hetzelfde proces als de API; bij groei kan hij
 * met dezelfde code als apart proces draaien (dezelfde tabel, SKIP LOCKED).
 */
import { inTransactie, SYSTEEM_CONTEXT, type Db } from '../db/pool.ts';
import { log } from '../util/log.ts';
import { meldKlaar, meldMislukt, pakTaak, type Taak } from './wachtrij.ts';

export type Behandelaar = (client: Db, taak: Taak) => Promise<void>;

const behandelaars = new Map<string, Behandelaar>();

export function registreerBehandelaar(soort: string, behandelaar: Behandelaar): void {
  behandelaars.set(soort, behandelaar);
}

/** Verwerkt hooguit een taak; levert op of er iets te doen was. */
export async function verwerkEen(): Promise<boolean> {
  const taak = await inTransactie(SYSTEEM_CONTEXT, (client) => pakTaak(client));
  if (!taak) return false;

  const behandelaar = behandelaars.get(taak.soort);
  const context = {
    organisatieId: null,
    administratieId: taak.administration_id,
    gebruikerId: null,
    actorSoort: 'systeem' as const,
  };

  try {
    if (!behandelaar) throw new Error(`Geen behandelaar voor taaksoort ${taak.soort}`);
    await inTransactie(context, (client) => behandelaar(client, taak));
    await inTransactie(SYSTEEM_CONTEXT, (client) => meldKlaar(client, taak.id));
  } catch (fout) {
    const melding = fout instanceof Error ? fout.message : String(fout);
    log.warn('Taak mislukt', { taak: taak.id, soort: taak.soort, poging: taak.pogingen, fout: melding });
    await inTransactie(SYSTEEM_CONTEXT, (client) => meldMislukt(client, taak, melding));
  }
  return true;
}

/** Start de lus. Levert een functie op om hem netjes te stoppen. */
export function startTaakverwerker(intervalMs = 2000): () => void {
  let bezig = false;
  let gestopt = false;

  const timer = setInterval(() => {
    if (bezig || gestopt) return;
    bezig = true;
    void (async () => {
      try {
        // Zolang er werk is, blijven doorgaan; anders wachten op het interval.
        while (!gestopt && (await verwerkEen())) {
          // niets: verwerkEen doet het werk
        }
      } catch (fout) {
        log.error('Fout in de taakverwerker', { fout: fout instanceof Error ? fout.message : String(fout) });
      } finally {
        bezig = false;
      }
    })();
  }, intervalMs);

  timer.unref?.();
  return () => {
    gestopt = true;
    clearInterval(timer);
  };
}
