/** Zet een fout uit de API om naar tekst die een gebruiker snapt. */
import { ApiFout, NetwerkFout } from '../api/client.ts';
import type { Sleutel } from '@gedmma/i18n';

export type Foutmelding = { titel: string; uitleg: string; code: string };

export function toonFout(
  fout: unknown,
  t: (sleutel: Sleutel, variabelen?: Record<string, string | number>) => string,
): Foutmelding {
  if (fout instanceof NetwerkFout) {
    return { titel: t('algemeen.fout'), uitleg: t('fout.netwerk'), code: 'netwerk' };
  }
  if (fout instanceof ApiFout) {
    // De server formuleert de duidelijkste melding, want die kent de context.
    // De vertaalde tekst is de terugval als de server niets bruikbaars stuurt.
    const sleutel = `fout.${fout.code}` as Sleutel;
    const vertaald = t(sleutel);
    return {
      titel: fout.message || (vertaald === sleutel ? t('algemeen.fout') : vertaald),
      uitleg: fout.hint,
      code: fout.code,
    };
  }
  return { titel: t('algemeen.fout'), uitleg: '', code: 'onbekend' };
}

/** Haalt veldfouten uit een validatiefout, zodat ze bij het juiste veld komen. */
export function veldfouten(fout: unknown): Record<string, string> {
  if (!(fout instanceof ApiFout) || fout.code !== 'validation_failed') return {};
  const details = fout.details;
  if (!Array.isArray(details)) return {};
  const uitkomst: Record<string, string> = {};
  for (const item of details) {
    if (item && typeof item === 'object' && 'veld' in item && 'probleem' in item) {
      uitkomst[String((item as { veld: unknown }).veld)] = String((item as { probleem: unknown }).probleem);
    }
  }
  return uitkomst;
}
