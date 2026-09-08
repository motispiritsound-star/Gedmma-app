/**
 * Betalingsherinneringen.
 *
 * De toon loopt op met de tijd: een factuur die drie dagen te laat is verdient
 * een ander bericht dan een die twee maanden openstaat. Wie de eerste al als
 * aanmaning schrijft, verliest klanten aan een administratieve slordigheid die
 * hun kant net zo goed had kunnen overkomen.
 *
 * Wat hier nadrukkelijk niet gebeurt: zelf besluiten dat er iets de deur uit
 * gaat. Dit bestand stuurt alleen wanneer iemand erom vraagt.
 */
import { Money } from '@mizen/money';
import type { Db } from '../../db/pool.ts';
import type { TenantContext } from '../../db/pool.ts';
import { auditeer } from '../audit/service.ts';
import { ApiFout } from '../../http/fout.ts';
import { mail } from '../../mail/index.ts';

export type Herinnering = {
  id: string;
  ronde: number;
  dagen_te_laat: number;
  openstaand_bedrag: string;
  valuta: string;
  verzonden_naar: string;
  onderwerp: string;
  verzonden_op: string;
  aanleiding: string;
};

type FactuurRij = {
  id: string;
  documentnummer: string | null;
  status: string;
  valuta: string;
  totaal_inclusief: string;
  betaald_bedrag: string;
  vervaldatum: string | null;
  contact_naam: string;
  contact_email: string | null;
  administratie_naam: string;
  administratie_email: string | null;
  iban: string | null;
};

async function haalFactuur(client: Db, administratieId: string, factuurId: string): Promise<FactuurRij> {
  const { rows } = await client.query<FactuurRij>(
    `SELECT f.id, f.documentnummer, f.status, f.valuta, f.totaal_inclusief::text, f.betaald_bedrag::text,
            f.vervaldatum::text AS vervaldatum,
            c.naam AS contact_naam, c.email::text AS contact_email,
            a.naam AS administratie_naam, a.email::text AS administratie_email, a.iban
       FROM sales_invoice f
       JOIN contact c ON c.id = f.contact_id
       JOIN administration a ON a.id = f.administration_id
      WHERE f.administration_id = $1 AND f.id = $2`,
    [administratieId, factuurId],
  );
  const factuur = rows[0];
  if (!factuur) {
    throw new ApiFout('not_found', 'Deze factuur bestaat niet.', 'Ververs het overzicht en probeer het opnieuw.');
  }
  return factuur;
}

/** Alle herinneringen die over deze factuur zijn verstuurd, nieuwste eerst. */
export async function herinneringenVan(client: Db, administratieId: string, factuurId: string): Promise<Herinnering[]> {
  const { rows } = await client.query<Herinnering>(
    `SELECT id, ronde, dagen_te_laat, openstaand_bedrag::text, valuta, verzonden_naar,
            onderwerp, verzonden_op::text AS verzonden_op, aanleiding
       FROM payment_reminder
      WHERE administration_id = $1 AND invoice_id = $2
      ORDER BY verzonden_op DESC`,
    [administratieId, factuurId],
  );
  return rows;
}

/**
 * De dag van vandaag als `jjjj-mm-dd`, in UTC.
 *
 * De datum wordt hier bepaald en doorgegeven in plaats van diep in de logica
 * uitgelezen, zodat een test kan zeggen welke dag het is. Anders is "is deze
 * factuur te laat" een vraag die je alleen kunt testen door te wachten.
 */
export function vandaag(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Hoeveel dagen de factuur te laat is op de gegeven dag; negatief betekent nog niet vervallen. */
function dagenTeLaat(vervaldatum: string, vandaag: string): number {
  const verschil = Date.parse(`${vandaag}T00:00:00Z`) - Date.parse(`${vervaldatum}T00:00:00Z`);
  return Math.floor(verschil / 86_400_000);
}

/**
 * De tekst van de herinnering. Drie tonen, oplopend, en bij elke een reden
 * waarom de klant misschien nog niet betaald heeft — want in verreweg de meeste
 * gevallen is dat gewoon zo.
 */
export function stelTekstOp(gegevens: {
  ronde: number;
  klant: string;
  documentnummer: string;
  bedrag: string;
  vervaldatum: string;
  dagenTeLaat: number;
  afzender: string;
  iban: string | null;
}): { onderwerp: string; tekst: string } {
  const { ronde, klant, documentnummer, bedrag, vervaldatum, dagenTeLaat: dagen, afzender, iban } = gegevens;
  const betaalregel = iban
    ? `Je kunt ${bedrag} overmaken op ${iban}, onder vermelding van ${documentnummer}.`
    : `Het gaat om ${bedrag}, onder vermelding van ${documentnummer}.`;

  if (ronde === 1) {
    return {
      onderwerp: `Herinnering: factuur ${documentnummer}`,
      tekst: [
        `Beste ${klant},`,
        '',
        `Factuur ${documentnummer} van ${bedrag} stond open tot ${vervaldatum} en is nog niet bij ons binnengekomen.`,
        'Waarschijnlijk is hij aan de aandacht ontsnapt; dat gebeurt.',
        '',
        betaalregel,
        '',
        'Heb je hem inmiddels betaald, dan is dit bericht overbodig en hoor ik het graag.',
        'Klopt er iets niet aan de factuur, laat het dan ook weten — dan lossen we dat op.',
        '',
        'Met vriendelijke groet,',
        afzender,
      ].join('\n'),
    };
  }

  if (ronde === 2) {
    return {
      onderwerp: `Tweede herinnering: factuur ${documentnummer}`,
      tekst: [
        `Beste ${klant},`,
        '',
        `Factuur ${documentnummer} van ${bedrag} is inmiddels ${dagen} dagen over de vervaldatum van ${vervaldatum}.`,
        'Eerder stuurde ik hierover al een herinnering.',
        '',
        betaalregel,
        '',
        'Lukt betalen op dit moment niet, neem dan contact op. Een afspraak over termijnen is',
        'voor ons allebei beter dan een factuur die blijft staan.',
        '',
        'Met vriendelijke groet,',
        afzender,
      ].join('\n'),
    };
  }

  return {
    onderwerp: `Aanmaning: factuur ${documentnummer}`,
    tekst: [
      `Beste ${klant},`,
      '',
      `Factuur ${documentnummer} van ${bedrag} is ${dagen} dagen te laat. De vervaldatum was ${vervaldatum}.`,
      'Eerdere herinneringen bleven onbeantwoord.',
      '',
      betaalregel,
      '',
      'Ik verzoek je het bedrag binnen veertien dagen te voldoen. Blijft betaling uit,',
      'dan draag ik de vordering over ter incasso; de kosten daarvan komen dan voor jouw rekening.',
      '',
      'Neem contact op als er iets speelt waar we samen uit kunnen komen.',
      '',
      'Met vriendelijke groet,',
      afzender,
    ].join('\n'),
  };
}

/**
 * Stelt de eerstvolgende herinnering samen zonder hem te versturen, zodat de
 * gebruiker ziet wat er weggaat voordat het weggaat.
 */
export async function bereidHerinneringVoor(
  client: Db,
  administratieId: string,
  factuurId: string,
  vandaag: string,
): Promise<{
  ronde: number;
  aan: string | null;
  onderwerp: string;
  tekst: string;
  openstaand: string;
  valuta: string;
  dagenTeLaat: number;
}> {
  const factuur = await haalFactuur(client, administratieId, factuurId);

  if (factuur.status === 'concept') {
    throw new ApiFout(
      'validation_failed',
      'Deze factuur is nog een concept.',
      'Een concept is nooit verstuurd, dus valt er ook niets aan te herinneren.',
    );
  }
  if (!factuur.vervaldatum) {
    throw new ApiFout(
      'validation_failed',
      'Deze factuur heeft geen vervaldatum.',
      'Zonder vervaldatum is niet te bepalen of er iets te laat is.',
    );
  }

  const openstaand = Money.vanTekst(factuur.totaal_inclusief, factuur.valuta).min(
    Money.vanTekst(factuur.betaald_bedrag, factuur.valuta),
  );
  if (!openstaand.isPositief()) {
    throw new ApiFout(
      'validation_failed',
      'Deze factuur staat niet meer open.',
      'Er valt niets te herinneren aan een factuur die betaald is.',
    );
  }

  const dagen = dagenTeLaat(factuur.vervaldatum, vandaag);
  if (dagen <= 0) {
    throw new ApiFout(
      'validation_failed',
      'Deze factuur is nog niet vervallen.',
      `De vervaldatum is ${factuur.vervaldatum}; wacht tot die voorbij is.`,
    );
  }

  const eerdere = await herinneringenVan(client, administratieId, factuurId);
  const ronde = eerdere.length + 1;

  const { onderwerp, tekst } = stelTekstOp({
    ronde,
    klant: factuur.contact_naam,
    documentnummer: factuur.documentnummer ?? '(zonder nummer)',
    bedrag: openstaand.formatteer('nl-NL'),
    vervaldatum: factuur.vervaldatum,
    dagenTeLaat: dagen,
    afzender: factuur.administratie_naam,
    iban: factuur.iban,
  });

  return {
    ronde,
    aan: factuur.contact_email,
    onderwerp,
    tekst,
    openstaand: openstaand.toString(),
    valuta: factuur.valuta,
    dagenTeLaat: dagen,
  };
}

/**
 * Verstuurt de herinnering en legt vast wat er is gegaan.
 *
 * De gebruiker mag onderwerp en tekst aanpassen; wat er werkelijk is verstuurd
 * wordt bewaard, niet het sjabloon. Anders staat er over een jaar een tekst in
 * de gegevens die nooit iemand heeft gelezen.
 */
export async function stuurHerinnering(
  client: Db,
  context: TenantContext & { administratieId: string },
  factuurId: string,
  opties: { aan?: string; onderwerp?: string; tekst?: string; vandaag: string },
): Promise<{ ronde: number; verzondenNaar: string; melding: string }> {
  const voorstel = await bereidHerinneringVoor(client, context.administratieId, factuurId, opties.vandaag);

  const aan = opties.aan ?? voorstel.aan;
  if (!aan) {
    throw new ApiFout(
      'validation_failed',
      'Er is geen e-mailadres bekend voor deze klant.',
      'Vul een e-mailadres in bij de relatie, of geef er een op bij het versturen.',
    );
  }

  const onderwerp = opties.onderwerp ?? voorstel.onderwerp;
  const tekst = opties.tekst ?? voorstel.tekst;
  const factuur = await haalFactuur(client, context.administratieId, factuurId);

  const uitkomst = await mail().verstuur({
    aan,
    onderwerp,
    tekst,
    antwoordAan: factuur.administratie_email ?? undefined,
  });

  if (!uitkomst.verzonden) {
    throw new ApiFout(
      'internal_error',
      'Het versturen is niet gelukt.',
      'Er is niets vastgelegd; probeer het later opnieuw.',
    );
  }

  await client.query(
    `INSERT INTO payment_reminder
       (administration_id, invoice_id, ronde, dagen_te_laat, openstaand_bedrag, valuta,
        verzonden_naar, onderwerp, tekst, verzonden_door, aanleiding)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'handmatig')`,
    [
      context.administratieId,
      factuurId,
      voorstel.ronde,
      voorstel.dagenTeLaat,
      voorstel.openstaand,
      voorstel.valuta,
      aan,
      onderwerp,
      tekst,
      context.gebruikerId,
    ],
  );

  await auditeer(client, context, {
    actie: 'verkoopfactuur.herinnering_verzonden',
    onderwerpSoort: 'sales_invoice',
    onderwerpId: factuurId,
    gegevens: {
      documentnummer: factuur.documentnummer,
      ronde: voorstel.ronde,
      aan,
      dagenTeLaat: voorstel.dagenTeLaat,
    },
  });

  return {
    ronde: voorstel.ronde,
    verzondenNaar: aan,
    melding: `De ${voorstel.ronde === 1 ? 'herinnering' : voorstel.ronde === 2 ? 'tweede herinnering' : 'aanmaning'} is verstuurd naar ${aan}.`,
  };
}
