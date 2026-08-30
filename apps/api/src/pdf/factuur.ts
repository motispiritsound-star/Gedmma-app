/**
 * Factuur-pdf.
 *
 * Bewust een eigen, sobere lay-out: leesbaar, met alle wettelijk verplichte
 * gegevens, en zonder afhankelijkheid van een headless browser. Kleur en logo
 * komen uit de instellingen van de administratie.
 */
import PDFDocument from 'pdfkit';
import { Money } from '@gedmma/money';

export type FactuurPdfGegevens = {
  soort: 'factuur' | 'creditnota' | 'offerte' | 'proforma';
  documentnummer: string;
  factuurdatum: string;
  leverdatum: string | null;
  vervaldatum: string | null;
  referentie: string | null;
  notitie: string | null;
  valuta: string;
  verkoper: {
    naam: string;
    adres: string | null;
    postcodePlaats: string | null;
    email: string | null;
    telefoon: string | null;
    kvkNummer: string | null;
    btwNummer: string | null;
    iban: string | null;
    voettekst: string | null;
    kleur: string | null;
  };
  afnemer: {
    naam: string;
    adres: string | null;
    postcodePlaats: string | null;
    btwNummer: string | null;
    land: string;
  };
  regels: {
    omschrijving: string;
    aantal: string;
    eenheid: string;
    prijs: string;
    btwCode: string;
    btwTarief: string;
    bedragExclusief: string;
  }[];
  btwGroepen: { omschrijving: string; grondslag: string; btw: string }[];
  totaalExclusief: string;
  totaalBtw: string;
  totaalInclusief: string;
  /** Vermeldingen die wettelijk op de factuur moeten staan, zoals "btw verlegd". */
  vermeldingen: string[];
  locale: string;
};

const TITELS: Record<FactuurPdfGegevens['soort'], string> = {
  factuur: 'Factuur',
  creditnota: 'Creditnota',
  offerte: 'Offerte',
  proforma: 'Pro-formafactuur',
};

function bedrag(waarde: string, valuta: string, locale: string): string {
  return Money.vanTekst(waarde, valuta).formatteer(locale);
}

function datum(waarde: string | null, locale: string): string {
  if (!waarde) return '-';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${waarde}T00:00:00Z`),
  );
}

/** Bouwt de pdf en levert hem als buffer op. */
export async function maakFactuurPdf(gegevens: FactuurPdfGegevens): Promise<Buffer> {
  const locale = gegevens.locale || 'nl-NL';
  const accent = gegevens.verkoper.kleur ?? '#1f4d6b';
  const document = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `${TITELS[gegevens.soort]} ${gegevens.documentnummer}` } });

  const stukken: Buffer[] = [];
  document.on('data', (stuk: Buffer) => stukken.push(stuk));
  const klaar = new Promise<Buffer>((resolve) => {
    document.on('end', () => resolve(Buffer.concat(stukken)));
  });

  const links = 50;
  const rechts = 545;

  // Kop
  document.fillColor(accent).fontSize(20).font('Helvetica-Bold').text(gegevens.verkoper.naam, links, 50);
  document.fillColor('#444444').fontSize(9).font('Helvetica');
  const afzender = [
    gegevens.verkoper.adres,
    gegevens.verkoper.postcodePlaats,
    gegevens.verkoper.email,
    gegevens.verkoper.telefoon,
  ].filter(Boolean);
  document.text(afzender.join('\n'), links, 76, { width: 240 });

  document.fillColor(accent).fontSize(22).font('Helvetica-Bold');
  document.text(TITELS[gegevens.soort], 320, 50, { width: 225, align: 'right' });
  document.fillColor('#111111').fontSize(10).font('Helvetica');
  const kopVelden: [string, string][] = [
    ['Nummer', gegevens.documentnummer],
    ['Datum', datum(gegevens.factuurdatum, locale)],
  ];
  if (gegevens.leverdatum) kopVelden.push(['Leverdatum', datum(gegevens.leverdatum, locale)]);
  if (gegevens.vervaldatum) kopVelden.push(['Vervaldatum', datum(gegevens.vervaldatum, locale)]);
  if (gegevens.referentie) kopVelden.push(['Referentie', gegevens.referentie]);

  let y = 82;
  for (const [label, waarde] of kopVelden) {
    document.font('Helvetica').fillColor('#666666').text(label, 320, y, { width: 100, align: 'right' });
    document.font('Helvetica-Bold').fillColor('#111111').text(waarde, 425, y, { width: 120, align: 'right' });
    y += 14;
  }

  // Geadresseerde
  document.font('Helvetica').fillColor('#666666').fontSize(9).text('Aan', links, 170);
  document.font('Helvetica-Bold').fillColor('#111111').fontSize(11).text(gegevens.afnemer.naam, links, 184);
  document.font('Helvetica').fontSize(9).fillColor('#444444');
  const ontvanger = [gegevens.afnemer.adres, gegevens.afnemer.postcodePlaats, gegevens.afnemer.land !== 'NL' ? gegevens.afnemer.land : null]
    .filter(Boolean)
    .join('\n');
  document.text(ontvanger, links, 200, { width: 240 });
  if (gegevens.afnemer.btwNummer) {
    document.text(`Btw-nummer: ${gegevens.afnemer.btwNummer}`, links, 240, { width: 240 });
  }

  // Regeltabel
  let tabelY = 275;
  const kolommen = { omschrijving: links, aantal: 300, prijs: 360, btw: 430, bedrag: 470 };

  document.rect(links, tabelY - 6, rechts - links, 20).fill(accent);
  document.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  document.text('Omschrijving', kolommen.omschrijving + 4, tabelY, { width: 240 });
  document.text('Aantal', kolommen.aantal, tabelY, { width: 55, align: 'right' });
  document.text('Prijs', kolommen.prijs, tabelY, { width: 65, align: 'right' });
  document.text('Btw', kolommen.btw, tabelY, { width: 35, align: 'right' });
  document.text('Bedrag', kolommen.bedrag, tabelY, { width: 71, align: 'right' });
  tabelY += 22;

  document.font('Helvetica').fontSize(9).fillColor('#111111');
  for (const regel of gegevens.regels) {
    const hoogte = Math.max(14, document.heightOfString(regel.omschrijving, { width: 240 }));
    if (tabelY + hoogte > 700) {
      document.addPage();
      tabelY = 60;
    }
    document.fillColor('#111111').text(regel.omschrijving, kolommen.omschrijving + 4, tabelY, { width: 240 });
    document.text(regel.aantal, kolommen.aantal, tabelY, { width: 55, align: 'right' });
    document.text(bedrag(regel.prijs, gegevens.valuta, locale), kolommen.prijs, tabelY, { width: 65, align: 'right' });
    document.text(`${Number(regel.btwTarief) * 100}%`, kolommen.btw, tabelY, { width: 35, align: 'right' });
    document.text(bedrag(regel.bedragExclusief, gegevens.valuta, locale), kolommen.bedrag, tabelY, { width: 71, align: 'right' });
    tabelY += hoogte + 6;
    document.moveTo(links, tabelY - 3).lineTo(rechts, tabelY - 3).strokeColor('#e5e5e5').stroke();
  }

  // Totalen
  tabelY += 10;
  const totaalRegel = (label: string, waarde: string, vet = false) => {
    document.font(vet ? 'Helvetica-Bold' : 'Helvetica').fillColor(vet ? '#111111' : '#444444').fontSize(vet ? 11 : 9);
    document.text(label, 330, tabelY, { width: 130, align: 'right' });
    document.text(bedrag(waarde, gegevens.valuta, locale), kolommen.bedrag, tabelY, { width: 71, align: 'right' });
    tabelY += vet ? 18 : 14;
  };

  totaalRegel('Subtotaal', gegevens.totaalExclusief);
  for (const groep of gegevens.btwGroepen) {
    totaalRegel(groep.omschrijving, groep.btw);
  }
  document.moveTo(330, tabelY).lineTo(rechts, tabelY).strokeColor(accent).stroke();
  tabelY += 6;
  totaalRegel('Totaal', gegevens.totaalInclusief, true);

  // Wettelijke vermeldingen en betaalinformatie
  tabelY += 12;
  document.font('Helvetica').fontSize(9).fillColor('#444444');
  for (const vermelding of gegevens.vermeldingen) {
    document.text(vermelding, links, tabelY, { width: rechts - links });
    tabelY += 14;
  }
  if (gegevens.notitie) {
    tabelY += 4;
    document.text(gegevens.notitie, links, tabelY, { width: rechts - links });
    tabelY += document.heightOfString(gegevens.notitie, { width: rechts - links }) + 6;
  }
  if (gegevens.verkoper.iban && gegevens.soort !== 'offerte') {
    document.font('Helvetica-Bold').fillColor('#111111');
    document.text(
      `Graag ${bedrag(gegevens.totaalInclusief, gegevens.valuta, locale)} overmaken op ${gegevens.verkoper.iban}` +
        (gegevens.vervaldatum ? ` voor ${datum(gegevens.vervaldatum, locale)}` : '') +
        `, onder vermelding van ${gegevens.documentnummer}.`,
      links,
      tabelY,
      { width: rechts - links },
    );
  }

  // Voettekst met de verplichte bedrijfsgegevens
  const voet = [
    gegevens.verkoper.kvkNummer ? `KVK ${gegevens.verkoper.kvkNummer}` : null,
    gegevens.verkoper.btwNummer ? `Btw-nummer ${gegevens.verkoper.btwNummer}` : null,
    gegevens.verkoper.iban ? `IBAN ${gegevens.verkoper.iban}` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  document.font('Helvetica').fontSize(8).fillColor('#888888');
  document.text(voet, links, 780, { width: rechts - links, align: 'center' });
  if (gegevens.verkoper.voettekst) {
    document.text(gegevens.verkoper.voettekst, links, 792, { width: rechts - links, align: 'center' });
  }

  document.end();
  return klaar;
}
