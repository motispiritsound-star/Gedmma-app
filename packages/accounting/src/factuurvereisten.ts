import { BoekhoudFout } from './fouten.ts';
import type { BtwCode } from './btw.ts';

/**
 * Controle op de wettelijke factuurvereisten voordat een factuur definitief
 * wordt gemaakt. De eisen komen uit de Wet op de omzetbelasting 1968 (artikel
 * 35a) en de btw-richtlijn; de geraadpleegde bronnen, versies en data staan in
 * docs/legal-source-register.md.
 *
 * Dit is een controle op volledigheid, geen fiscaal advies. De uitkomst zegt
 * welk gegeven ontbreekt, niet of de fiscale behandeling juist is.
 */
export type FactuurGegevens = {
  factuurdatum: string | null;
  factuurnummer: string | null;
  leverdatum: string | null;
  /** Gegevens van de ondernemer die de factuur uitreikt. */
  verkoper: {
    naam: string | null;
    adres: string | null;
    postcodePlaats: string | null;
    btwNummer: string | null;
    kvkNummer: string | null;
  };
  afnemer: {
    naam: string | null;
    adres: string | null;
    postcodePlaats: string | null;
    btwNummer: string | null;
    land: string | null;
  };
  regels: readonly {
    omschrijving: string | null;
    aantal: string | null;
    btwCode: BtwCode;
  }[];
};

export type Vereistenprobleem = {
  veld: string;
  /** Uitleg in gewone taal, bedoeld om direct te tonen. */
  melding: string;
  /** Blokkeert definitief maken, of alleen een waarschuwing? */
  ernst: 'blokkerend' | 'waarschuwing';
};

const LEEG = (waarde: string | null | undefined): boolean =>
  waarde === null || waarde === undefined || waarde.trim() === '';

/**
 * Levert de ontbrekende gegevens op. Een lege lijst betekent dat de factuur
 * de gegevens bevat die de wet voorschrijft.
 */
export function controleerFactuurvereisten(gegevens: FactuurGegevens): Vereistenprobleem[] {
  const problemen: Vereistenprobleem[] = [];
  const eis = (voorwaarde: boolean, veld: string, melding: string, ernst: Vereistenprobleem['ernst'] = 'blokkerend') => {
    if (!voorwaarde) problemen.push({ veld, melding, ernst });
  };

  eis(!LEEG(gegevens.factuurdatum), 'factuurdatum', 'Een factuur moet een factuurdatum hebben.');
  eis(!LEEG(gegevens.factuurnummer), 'factuurnummer', 'Een factuur moet een opeenvolgend factuurnummer hebben.');
  eis(!LEEG(gegevens.leverdatum), 'leverdatum', 'Vermeld wanneer je hebt geleverd of de dienst hebt verricht.', 'waarschuwing');

  eis(!LEEG(gegevens.verkoper.naam), 'verkoper.naam', 'Vul je eigen bedrijfsnaam in bij de instellingen van deze administratie.');
  eis(!LEEG(gegevens.verkoper.adres), 'verkoper.adres', 'Vul je eigen adres in bij de instellingen van deze administratie.');
  eis(!LEEG(gegevens.verkoper.btwNummer), 'verkoper.btwNummer', 'Je btw-identificatienummer moet op de factuur staan.');
  eis(!LEEG(gegevens.verkoper.kvkNummer), 'verkoper.kvkNummer', 'Zet je KVK-nummer op de factuur; dat wordt in de praktijk verwacht.', 'waarschuwing');

  eis(!LEEG(gegevens.afnemer.naam), 'afnemer.naam', 'De naam van je klant moet op de factuur staan.');
  eis(!LEEG(gegevens.afnemer.adres), 'afnemer.adres', 'Het adres van je klant moet op de factuur staan.');

  eis(gegevens.regels.length > 0, 'regels', 'Een factuur zonder regels kan niet definitief worden gemaakt.');

  for (const [index, regel] of gegevens.regels.entries()) {
    const nummer = index + 1;
    eis(!LEEG(regel.omschrijving), `regels.${index}.omschrijving`, `Regel ${nummer} heeft geen omschrijving van wat je hebt geleverd.`);
    eis(!LEEG(regel.aantal), `regels.${index}.aantal`, `Regel ${nummer} heeft geen aantal of hoeveelheid.`, 'waarschuwing');
  }

  const heeftVerlegd = gegevens.regels.some((r) => r.btwCode.verlegd);
  const heeftIC = gegevens.regels.some((r) => r.btwCode.icLevering);

  if (heeftVerlegd) {
    eis(
      !LEEG(gegevens.afnemer.btwNummer),
      'afnemer.btwNummer',
      'Bij btw verlegd moet het btw-identificatienummer van je klant op de factuur staan.',
    );
  }
  if (heeftIC) {
    eis(
      !LEEG(gegevens.afnemer.btwNummer),
      'afnemer.btwNummer',
      'Bij een levering binnen de EU moet het btw-identificatienummer van je klant op de factuur staan.',
    );
    eis(
      !LEEG(gegevens.afnemer.land) && gegevens.afnemer.land !== 'NL',
      'afnemer.land',
      'Een intracommunautaire levering gaat naar een ander EU-land; controleer het land van je klant.',
    );
  }

  return problemen;
}

/** Gooit als er blokkerende problemen zijn; waarschuwingen worden teruggegeven. */
export function eisFactuurvereisten(gegevens: FactuurGegevens): Vereistenprobleem[] {
  const problemen = controleerFactuurvereisten(gegevens);
  const blokkerend = problemen.filter((p) => p.ernst === 'blokkerend');
  if (blokkerend.length > 0) {
    throw new BoekhoudFout(
      'invoice_requirements_missing',
      `De factuur mist ${blokkerend.length} gegeven(s) die wettelijk verplicht zijn.`,
      blokkerend.map((p) => p.melding).join(' '),
      { problemen: blokkerend },
    );
  }
  return problemen;
}
