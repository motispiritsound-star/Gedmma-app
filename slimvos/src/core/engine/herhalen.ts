import type { Vraag } from '../types';

/**
 * Fouten komen terug.
 *
 * Een vraag die je fout had, verschijnt na een dag opnieuw. Heb je hem dan
 * goed, dan komt hij na drie dagen nog eens, daarna na een week, daarna na drie
 * weken — en dan is hij klaar. Gaat hij weer fout, dan begint de reeks opnieuw.
 *
 * Dit is het verschil tussen "je hebt geoefend" en "je hebt het geleerd":
 * zonder herhaling ben je een som die je fout had over drie dagen gewoon weer
 * kwijt.
 */
export interface Herhaalitem {
  /** De hele vraag, zodat hij later precies zo terugkomt. */
  vraag: Vraag;
  onderwerpId: string;
  /** Hoe vaak deze vraag al fout ging. */
  fouten: number;
  /** Hoe vaak hij sindsdien op rij goed was; bepaalt het interval. */
  goedOpRij: number;
  /** Vanaf wanneer hij weer aan de beurt is. */
  volgendeKeer: number;
  toegevoegd: number;
}

const DAG = 86400000;
/** Na 1, 3, 7 en 21 dagen. Daarna gaat de vraag uit de bak. */
export const INTERVALLEN = [1 * DAG, 3 * DAG, 7 * DAG, 21 * DAG];
export const MAX_BAK = 80;
/** Hoeveel herhalingen er maximaal in één ronde zitten. */
export const MAX_PER_RONDE = 3;

/**
 * Vragen worden ter plekke gemaakt, dus hun id verschilt per keer. De tekst
 * plus het antwoord is wél stabiel en identificeert de vraag prima.
 */
export function sleutel(vraag: Vraag): string {
  return `${vraag.onderwerpId}|${vraag.context ?? ''}|${vraag.stam}|${vraag.antwoord}`;
}

export function voegToe(bak: Herhaalitem[], vraag: Vraag, nu = Date.now()): Herhaalitem[] {
  const sl = sleutel(vraag);
  const bestaand = bak.find((i) => sleutel(i.vraag) === sl);

  if (bestaand) {
    // Alweer fout: terug naar het kortste interval.
    return bak.map((i) =>
      sleutel(i.vraag) === sl
        ? { ...i, fouten: i.fouten + 1, goedOpRij: 0, volgendeKeer: nu + INTERVALLEN[0] }
        : i,
    );
  }

  const nieuw: Herhaalitem = {
    vraag,
    onderwerpId: vraag.onderwerpId,
    fouten: 1,
    goedOpRij: 0,
    volgendeKeer: nu + INTERVALLEN[0],
    toegevoegd: nu,
  };
  // Loopt de bak vol, dan valt de oudste eruit; recente fouten zijn urgenter.
  const samen = [...bak, nieuw];
  return samen.length <= MAX_BAK ? samen : samen.slice(samen.length - MAX_BAK);
}

/** Verwerkt het antwoord op een herhaalde vraag. Goed genoeg = uit de bak. */
export function naHerhaling(bak: Herhaalitem[], vraag: Vraag, goed: boolean, nu = Date.now()): Herhaalitem[] {
  const sl = sleutel(vraag);
  if (!bak.some((i) => sleutel(i.vraag) === sl)) return bak;
  if (!goed) return voegToe(bak, vraag, nu);

  const uit: Herhaalitem[] = [];
  for (const item of bak) {
    if (sleutel(item.vraag) !== sl) {
      uit.push(item);
      continue;
    }
    const stap = item.goedOpRij + 1;
    if (stap >= INTERVALLEN.length) continue; // uitgeleerd
    uit.push({ ...item, goedOpRij: stap, volgendeKeer: nu + INTERVALLEN[stap] });
  }
  return uit;
}

/** Welke vragen zijn nu aan de beurt? Voor één onderwerp, of voor alles. */
export function teHerhalen(
  bak: Herhaalitem[],
  opties: { onderwerpId?: string; nu?: number; max?: number } = {},
): Herhaalitem[] {
  const nu = opties.nu ?? Date.now();
  return bak
    .filter((i) => i.volgendeKeer <= nu)
    .filter((i) => !opties.onderwerpId || i.onderwerpId === opties.onderwerpId)
    // Wat het langst wacht en het vaakst fout ging, gaat voor.
    .sort((a, b) => b.fouten - a.fouten || a.volgendeKeer - b.volgendeKeer)
    .slice(0, opties.max ?? MAX_PER_RONDE);
}

export function aantalTeHerhalen(bak: Herhaalitem[], nu = Date.now()): number {
  return bak.filter((i) => i.volgendeKeer <= nu).length;
}

/** Onderwerpen waar nog iets klaarstaat, met hoeveel. */
export function herhalingenPerOnderwerp(bak: Herhaalitem[], nu = Date.now()): Map<string, number> {
  const uit = new Map<string, number>();
  for (const item of bak) {
    if (item.volgendeKeer > nu) continue;
    uit.set(item.onderwerpId, (uit.get(item.onderwerpId) ?? 0) + 1);
  }
  return uit;
}
