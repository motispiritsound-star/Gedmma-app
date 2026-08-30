/**
 * Factuur klaarmaken en versturen: pdf genereren, UBL erbij, e-mail eruit.
 *
 * De status wordt pas 'verzonden' als de maildriver bevestigt. Zo staat er
 * nooit "verzonden" bij een factuur die de klant niet heeft gekregen.
 */
import { Money } from '@gedmma/money';
import { vakOmschrijving } from '@gedmma/accounting';
import type { Db, TenantContext } from '../../db/pool.ts';
import { ApiFout } from '../../http/fout.ts';
import { auditeer } from '../audit/service.ts';
import { leesAdministratie } from '../organisaties/service.ts';
import { factuuradres, leesContact } from '../relaties/service.ts';
import { btwCodeOpId } from '../grootboek/repo.ts';
import { maakFactuurPdf, type FactuurPdfGegevens } from '../../pdf/factuur.ts';
import { btwCategorieVan, maakUbl, type UblFactuur } from '../../ubl/factuur.ts';
import { uploadDocument } from '../documenten/service.ts';
import { mail } from '../../mail/index.ts';
import { leesFactuur } from './service.ts';

/** Verzamelt alles wat de pdf en de UBL nodig hebben. */
async function verzamel(client: Db, administratieId: string, factuurId: string) {
  const { factuur, regels } = await leesFactuur(client, administratieId, factuurId);
  const administratie = await leesAdministratie(client, administratieId);
  const contact = await leesContact(client, administratieId, factuur.contact_id);
  const adres = await factuuradres(client, administratieId, factuur.contact_id);

  const btwCodes = new Map<string, Awaited<ReturnType<typeof btwCodeOpId>>>();
  for (const regel of regels) {
    if (!btwCodes.has(regel.tax_code_id)) {
      btwCodes.set(regel.tax_code_id, await btwCodeOpId(client, administratieId, regel.tax_code_id));
    }
  }

  return { factuur, regels, administratie, contact, adres, btwCodes };
}

/** Genereert de pdf en bewaart hem als document bij de factuur. */
export async function maakPdf(
  client: Db,
  context: TenantContext & { administratieId: string },
  factuurId: string,
): Promise<{ documentId: string; inhoud: Buffer; bestandsnaam: string }> {
  const { factuur, regels, administratie, contact, adres, btwCodes } = await verzamel(
    client,
    context.administratieId,
    factuurId,
  );

  if (factuur.status === 'concept' && factuur.soort !== 'offerte') {
    throw new ApiFout(
      'validation_failed',
      'Een conceptfactuur heeft nog geen nummer en kan niet als pdf worden verstuurd.',
      'Maak de factuur eerst definitief.',
    );
  }

  const groepen = new Map<string, { omschrijving: string; grondslag: Money; btw: Money; tarief: string; categorie: string }>();
  for (const regel of regels) {
    const code = btwCodes.get(regel.tax_code_id)!;
    const sleutel = code.id;
    const bestaand = groepen.get(sleutel);
    const grondslag = Money.vanTekst(regel.bedrag_exclusief, factuur.valuta);
    const btw = Money.vanTekst(regel.bedrag_btw, factuur.valuta);
    if (bestaand) {
      bestaand.grondslag = bestaand.grondslag.plus(grondslag);
      bestaand.btw = bestaand.btw.plus(btw);
    } else {
      groepen.set(sleutel, {
        omschrijving: `Btw ${(Number(code.tarief.toString()) * 100).toFixed(0)}%`,
        grondslag,
        btw,
        tarief: code.tarief.toString(),
        categorie: btwCategorieVan({
          verlegd: code.verlegd,
          icLevering: code.icLevering,
          tarief: code.tarief.toString(),
          vak: code.vak,
        }),
      });
    }
  }

  const vermeldingen: string[] = [];
  for (const code of btwCodes.values()) {
    if (code.verlegd) vermeldingen.push('Btw verlegd.');
    if (code.icLevering) vermeldingen.push('Intracommunautaire levering, 0% btw.');
    if (code.vak === '3a') vermeldingen.push('Uitvoer buiten de EU, 0% btw.');
  }

  const gegevens: FactuurPdfGegevens = {
    soort: factuur.soort === 'creditnota' ? 'creditnota' : factuur.soort === 'offerte' ? 'offerte' : 'factuur',
    documentnummer: factuur.documentnummer ?? 'CONCEPT',
    factuurdatum: factuur.factuurdatum,
    leverdatum: factuur.leverdatum,
    vervaldatum: factuur.vervaldatum,
    referentie: factuur.referentie,
    notitie: factuur.notitie,
    valuta: factuur.valuta,
    verkoper: {
      naam: administratie.naam,
      adres: administratie.adres,
      postcodePlaats: administratie.postcode_plaats,
      email: administratie.email,
      telefoon: administratie.telefoon,
      kvkNummer: administratie.kvk_nummer,
      btwNummer: administratie.btw_nummer,
      iban: administratie.iban,
      voettekst: administratie.factuur_voettekst,
      kleur: administratie.huisstijl_kleur,
    },
    afnemer: {
      naam: contact.naam,
      adres: adres?.adres ?? null,
      postcodePlaats: adres ? `${adres.postcode ?? ''} ${adres.plaats ?? ''}`.trim() : null,
      btwNummer: contact.btw_nummer,
      land: contact.land,
    },
    regels: regels.map((regel) => ({
      omschrijving: regel.omschrijving,
      aantal: regel.aantal.replace(/\.?0+$/, ''),
      eenheid: regel.eenheid,
      prijs: regel.prijs,
      btwCode: regel.btw_code,
      btwTarief: regel.btw_tarief,
      bedragExclusief: regel.bedrag_exclusief,
    })),
    btwGroepen: [...groepen.values()].map((groep) => ({
      omschrijving: groep.omschrijving,
      grondslag: groep.grondslag.toString(),
      btw: groep.btw.toString(),
    })),
    totaalExclusief: factuur.totaal_exclusief,
    totaalBtw: factuur.totaal_btw,
    totaalInclusief: factuur.totaal_inclusief,
    vermeldingen: [...new Set(vermeldingen)],
    locale: administratie.locale === 'nl' ? 'nl-NL' : administratie.locale,
  };

  const inhoud = await maakFactuurPdf(gegevens);
  const bestandsnaam = `${gegevens.soort}-${gegevens.documentnummer}.pdf`;

  const document = await uploadDocument(client, context, {
    inhoud,
    bestandsnaam,
    mime: 'application/pdf',
    soort: 'verkoopfactuur',
  });

  await client.query('UPDATE sales_invoice SET pdf_document_id = $3 WHERE administration_id = $1 AND id = $2', [
    context.administratieId,
    factuurId,
    document.id,
  ]);

  return { documentId: document.id, inhoud, bestandsnaam };
}

/** Genereert de UBL-versie van een factuur. */
export async function maakUblBestand(
  client: Db,
  administratieId: string,
  factuurId: string,
): Promise<{ xml: string; bestandsnaam: string }> {
  const { factuur, regels, administratie, contact, adres, btwCodes } = await verzamel(client, administratieId, factuurId);

  const groepen = new Map<string, { categorie: string; tarief: string; grondslag: Money; btw: Money }>();
  for (const regel of regels) {
    const code = btwCodes.get(regel.tax_code_id)!;
    const categorie = btwCategorieVan({
      verlegd: code.verlegd,
      icLevering: code.icLevering,
      tarief: code.tarief.toString(),
      vak: code.vak,
    });
    const sleutel = `${categorie}-${code.tarief.toString()}`;
    const bestaand = groepen.get(sleutel);
    const grondslag = Money.vanTekst(regel.bedrag_exclusief, factuur.valuta);
    const btw = Money.vanTekst(regel.bedrag_btw, factuur.valuta);
    if (bestaand) {
      bestaand.grondslag = bestaand.grondslag.plus(grondslag);
      bestaand.btw = bestaand.btw.plus(btw);
    } else {
      groepen.set(sleutel, { categorie, tarief: code.tarief.toString(), grondslag, btw });
    }
  }

  const ubl: UblFactuur = {
    documentnummer: factuur.documentnummer ?? 'CONCEPT',
    factuurdatum: factuur.factuurdatum,
    vervaldatum: factuur.vervaldatum,
    soort: factuur.soort === 'creditnota' ? 'creditnota' : 'factuur',
    valuta: factuur.valuta,
    verkoper: {
      naam: administratie.naam,
      adres: administratie.adres,
      postcode: administratie.postcode_plaats?.split(' ').slice(0, 2).join(' ') ?? null,
      plaats: administratie.postcode_plaats?.split(' ').slice(2).join(' ') ?? null,
      land: administratie.land,
      btwNummer: administratie.btw_nummer,
      kvkNummer: administratie.kvk_nummer,
      iban: administratie.iban,
    },
    afnemer: {
      naam: contact.naam,
      adres: adres?.adres ?? null,
      postcode: adres?.postcode ?? null,
      plaats: adres?.plaats ?? null,
      land: contact.land,
      btwNummer: contact.btw_nummer,
    },
    regels: regels.map((regel) => {
      const code = btwCodes.get(regel.tax_code_id)!;
      return {
        nummer: regel.regelnummer,
        omschrijving: regel.omschrijving,
        aantal: regel.aantal,
        eenheid: regel.eenheid,
        prijs: regel.prijs,
        bedragExclusief: regel.bedrag_exclusief,
        btwTarief: code.tarief.toString(),
        btwCategorie: btwCategorieVan({
          verlegd: code.verlegd,
          icLevering: code.icLevering,
          tarief: code.tarief.toString(),
          vak: code.vak,
        }),
      };
    }),
    btwGroepen: [...groepen.values()].map((groep) => ({
      categorie: groep.categorie,
      tarief: groep.tarief,
      grondslag: groep.grondslag.toString(),
      btw: groep.btw.toString(),
    })),
    totaalExclusief: factuur.totaal_exclusief,
    totaalBtw: factuur.totaal_btw,
    totaalInclusief: factuur.totaal_inclusief,
    notitie: factuur.notitie,
  };

  return {
    xml: maakUbl(ubl),
    bestandsnaam: `${factuur.documentnummer ?? 'concept'}-ubl.xml`,
  };
}

/** Verstuurt de factuur per e-mail met pdf en UBL als bijlage. */
export async function verstuurFactuur(
  client: Db,
  context: TenantContext & { administratieId: string },
  factuurId: string,
  opties: { aan?: string; onderwerp?: string; tekst?: string } = {},
): Promise<{ verzondenNaar: string; driver: string; melding: string }> {
  const { factuur, administratie, contact } = await verzamel(client, context.administratieId, factuurId);

  if (factuur.status === 'concept') {
    throw new ApiFout(
      'validation_failed',
      'Deze factuur is nog een concept.',
      'Maak de factuur eerst definitief; daarna kun je hem versturen.',
    );
  }

  const aan = opties.aan ?? contact.email;
  if (!aan) {
    throw new ApiFout(
      'validation_failed',
      `Er is geen e-mailadres bekend voor ${contact.naam}.`,
      'Vul een e-mailadres in bij de relatie, of geef er een op bij het versturen.',
    );
  }

  const pdf = await maakPdf(client, context, factuurId);
  const ubl = await maakUblBestand(client, context.administratieId, factuurId);
  const bedrag = Money.vanTekst(factuur.totaal_inclusief, factuur.valuta).formatteer('nl-NL');

  const onderwerp = opties.onderwerp ?? `${factuur.soort === 'creditnota' ? 'Creditnota' : 'Factuur'} ${factuur.documentnummer} van ${administratie.naam}`;
  const tekst =
    opties.tekst ??
    [
      `Beste ${contact.naam},`,
      '',
      `Hierbij ontvang je ${factuur.soort === 'creditnota' ? 'de creditnota' : 'de factuur'} met nummer ${factuur.documentnummer} van ${bedrag}.`,
      factuur.vervaldatum ? `Wij zien de betaling graag tegemoet voor ${factuur.vervaldatum}.` : '',
      '',
      'Met vriendelijke groet,',
      administratie.naam,
    ]
      .filter(Boolean)
      .join('\n');

  const uitkomst = await mail().verstuur({
    aan,
    onderwerp,
    tekst,
    bijlagen: [
      { bestandsnaam: pdf.bestandsnaam, mime: 'application/pdf', inhoud: pdf.inhoud },
      { bestandsnaam: ubl.bestandsnaam, mime: 'application/xml', inhoud: Buffer.from(ubl.xml, 'utf8') },
    ],
    antwoordAan: administratie.email ?? undefined,
  });

  if (!uitkomst.verzonden) {
    throw new ApiFout(
      'internal_error',
      'Het versturen is niet gelukt.',
      'De factuur blijft definitief staan; probeer het later opnieuw of verstuur de pdf zelf.',
    );
  }

  await client.query(
    `UPDATE sales_invoice SET status = 'verzonden', verzonden_op = now(), verzonden_naar = $3
      WHERE administration_id = $1 AND id = $2 AND status = 'definitief'`,
    [context.administratieId, factuurId, aan],
  );

  await auditeer(client, context, {
    actie: 'verkoopfactuur.verzonden',
    onderwerpSoort: 'sales_invoice',
    onderwerpId: factuurId,
    gegevens: { documentnummer: factuur.documentnummer, aan, driver: uitkomst.driver },
  });

  return { verzondenNaar: aan, driver: uitkomst.driver, melding: uitkomst.bericht };
}

/** Alleen gebruikt in het btw-overzicht van de pdf-tekst. */
export { vakOmschrijving };
