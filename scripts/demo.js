#!/usr/bin/env node
/**
 * `npm run demo` — vult een demo-administratie met verzonnen gegevens.
 *
 * Bedoeld om het product te kunnen bekijken met inhoud erin, in plaats van een
 * leeg scherm. Alles gaat via de gewone API, dus wat je ziet is echt geboekt:
 * de balans sluit, de btw sluit aan en het auditspoor loopt door.
 *
 * Alle namen, adressen, nummers en bedragen zijn verzonnen. Er staan bewust
 * geen echte persoonsgegevens en geen productiewachtwoorden in dit bestand.
 */

import { Money } from '@gedmma/money';

const basis = process.env.API_URL ?? 'http://127.0.0.1:4000';
const EMAIL = 'demo@voorbeeld.test';
// Bewust geen woord uit het e-mailadres: het wachtwoordbeleid weigert dat.
const WACHTWOORD = 'zonlicht op de kade 2026';

let token = null;

function meld(bericht) {
  process.stdout.write(`${bericht}\n`);
}

async function verzoek(methode, pad, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const antwoord = await fetch(`${basis}${pad}`, {
    method: methode,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const tekst = await antwoord.text();
  let inhoud = null;
  if (tekst) {
    try {
      inhoud = JSON.parse(tekst);
    } catch {
      inhoud = tekst;
    }
  }
  return { status: antwoord.status, body: inhoud };
}

/** Doet een verzoek en stopt met een leesbare melding als het misgaat. */
async function moet(methode, pad, body, verwacht = [200, 201, 202]) {
  const antwoord = await verzoek(methode, pad, body);
  if (!verwacht.includes(antwoord.status)) {
    const detail = antwoord.body?.error?.message ?? JSON.stringify(antwoord.body);
    throw new Error(`${methode} ${pad} gaf ${antwoord.status}: ${detail}`);
  }
  return antwoord.body;
}

const jaar = new Date().getUTCFullYear();
const d = (maand, dag) => `${jaar}-${String(maand).padStart(2, '0')}-${String(dag).padStart(2, '0')}`;

// --- Aanmelden -------------------------------------------------------------

async function meldAan() {
  const registratie = await verzoek('POST', '/api/v1/auth/register', {
    email: EMAIL,
    naam: 'Noor van Dijk',
    wachtwoord: WACHTWOORD,
  });
  if (registratie.status === 202) meld('Demo-account aangemaakt.');
  else if (registratie.status === 409) meld('Demo-account bestond al; er komt een tweede administratie bij.');
  else if (registratie.status === 429) {
    throw new Error('De registratielimiet is bereikt. Wacht even, of start de database opnieuw op.');
  } else if (registratie.status !== 202) {
    throw new Error(`Registreren gaf ${registratie.status}: ${JSON.stringify(registratie.body)}`);
  }

  const aanmelding = await moet('POST', '/api/v1/auth/login', {
    email: EMAIL,
    wachtwoord: WACHTWOORD,
  });
  token = aanmelding.token;
  if (!token) throw new Error('Aanmelden leverde geen sessie op.');
}

// --- Administratie ---------------------------------------------------------

async function maakAdministratie() {
  const organisatie = await moet('POST', '/api/v1/organisaties', {
    naam: 'Van Dijk Ontwerpstudio',
    abonnement: 'mkb',
  });

  const administratie = await moet(
    'POST',
    `/api/v1/organisaties/${organisatie.organisatieId}/administraties`,
    {
      naam: 'Van Dijk Ontwerpstudio',
      schemaSjabloon: 'zzp',
      kvkNummer: '90000001',
      btwNummer: 'NL900000001B01',
      adres: 'Havenkade 12',
      postcodePlaats: '3511 AA Voorbeeldstad',
      email: 'hallo@vandijkontwerp.test',
      iban: 'NL91ABNA0417164300',
      boekjaarBegint: d(1, 1),
      boekjaarEindigt: d(12, 31),
    },
  );

  return `/api/v1/administraties/${administratie.administratieId}`;
}

/** Zet de rekeningen en btw-codes klaar als opzoektabel op code. */
async function registers(pad) {
  const rekeningen = await moet('GET', `${pad}/rekeningen`);
  const btwcodes = await moet('GET', `${pad}/btwcodes`);
  return {
    rekening: Object.fromEntries(rekeningen.rekeningen.map((r) => [r.code, r.id])),
    btw: Object.fromEntries(btwcodes.btwcodes.map((c) => [c.code, c.id])),
  };
}

// --- Verzonnen gegevens ----------------------------------------------------

const KLANTEN = [
  {
    naam: 'Bakkerij Jansen',
    email: 'administratie@bakkerijjansen.test',
    btwNummer: 'NL900000002B01',
    iban: 'NL02ABNA0123456789',
    betalingstermijnDagen: 14,
    adres: { adres: 'Marktplein 2', postcode: '4321 BA', plaats: 'Elders' },
  },
  {
    naam: 'Gemeente Zuiderveld',
    email: 'facturen@zuiderveld.test',
    btwNummer: 'NL900000003B01',
    iban: 'NL03INGB0002345678',
    betalingstermijnDagen: 30,
    adres: {
      adres: 'Raadhuisplein 1',
      postcode: '2611 AA',
      plaats: 'Zuiderveld',
    },
  },
  {
    naam: 'Studio Nova',
    email: 'hallo@studionova.test',
    btwNummer: 'NL900000004B01',
    iban: 'NL04RABO0003456789',
    betalingstermijnDagen: 30,
    adres: {
      adres: 'Kanaalweg 88',
      postcode: '9711 AB',
      plaats: 'Noorderbrug',
    },
  },
  {
    naam: 'De Groene Kas',
    email: 'info@degroenekas.test',
    btwNummer: 'NL900000005B01',
    iban: 'NL05TRIO0004567890',
    betalingstermijnDagen: 21,
    adres: {
      adres: 'Tuinderslaan 5',
      postcode: '6511 CD',
      plaats: 'Westerhout',
    },
  },
  {
    naam: 'Praktijk Verheul',
    email: 'praktijk@verheul.test',
    btwNummer: 'NL900000006B01',
    iban: 'NL06SNSB0005678901',
    betalingstermijnDagen: 14,
    adres: {
      adres: 'Dorpsstraat 41',
      postcode: '7311 EF',
      plaats: 'Oosterdal',
    },
  },
];

const LEVERANCIERS = [
  {
    naam: 'Kantoorzaak Bosman',
    email: 'verkoop@bosmankantoor.test',
    iban: 'NL44RABO0123456789',
  },
  {
    naam: 'HostingPunt',
    email: 'facturen@hostingpunt.test',
    iban: 'NL45INGB0987654321',
  },
  {
    naam: 'Verzekeringen Zuidwal',
    email: 'polis@zuidwal.test',
    iban: 'NL46ABNA0555666777',
  },
  {
    naam: 'Boekhoudkantoor Meijer',
    email: 'administratie@meijeradvies.test',
    iban: 'NL47TRIO0111222333',
  },
];

/** Verkoopfacturen: omschrijving, klant, datum, regels, en wat ermee gebeurt. */
function verkoopwerk(klanten, r, b) {
  const omzet = r['8000'];
  const btw21 = b['VK-21'];
  const btw9 = b['VK-9'];
  const omzetLaag = r['8010'];

  return [
    {
      klant: klanten['Bakkerij Jansen'],
      datum: d(1, 12),
      afhandeling: 'betaald',
      regels: [
        {
          omschrijving: 'Huisstijl en logo-ontwerp',
          aantal: '1',
          prijs: '2450.00',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
      ],
    },
    {
      klant: klanten['Gemeente Zuiderveld'],
      datum: d(2, 3),
      afhandeling: 'betaald',
      regels: [
        {
          omschrijving: 'Ontwerp informatiepanelen',
          aantal: '14',
          prijs: '95.00',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
        {
          omschrijving: 'Drukwerkbegeleiding',
          aantal: '6',
          prijs: '85.00',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
      ],
    },
    {
      klant: klanten['Studio Nova'],
      datum: d(3, 18),
      afhandeling: 'betaald',
      regels: [
        {
          omschrijving: 'Ontwerpuren maart',
          aantal: '32',
          prijs: '92.50',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
      ],
    },
    {
      klant: klanten['De Groene Kas'],
      datum: d(4, 8),
      afhandeling: 'betaald',
      regels: [
        {
          omschrijving: 'Verpakkingsontwerp seizoensbox',
          aantal: '1',
          prijs: '1875.00',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
        {
          omschrijving: 'Fotografie productlijn',
          aantal: '1',
          prijs: '640.00',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
      ],
    },
    {
      klant: klanten['Praktijk Verheul'],
      datum: d(5, 6),
      afhandeling: 'betaald',
      regels: [
        {
          omschrijving: 'Wachtkamerbrochure, ontwerp en opmaak',
          aantal: '1',
          prijs: '780.00',
          btwCodeId: btw9,
          rekeningId: omzetLaag,
        },
      ],
    },
    {
      klant: klanten['Bakkerij Jansen'],
      datum: d(6, 2),
      afhandeling: 'deels betaald',
      regels: [
        {
          omschrijving: 'Ontwerp seizoenscampagne',
          aantal: '1',
          prijs: '1320.00',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
      ],
    },
    {
      klant: klanten['Studio Nova'],
      datum: d(6, 24),
      afhandeling: 'verzonden',
      regels: [
        {
          omschrijving: 'Ontwerpuren juni',
          aantal: '24',
          prijs: '92.50',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
        {
          omschrijving: 'Licentie beeldmateriaal',
          aantal: '1',
          prijs: '210.00',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
      ],
    },
    {
      klant: klanten['Gemeente Zuiderveld'],
      datum: d(7, 15),
      afhandeling: 'verzonden',
      regels: [
        {
          omschrijving: 'Bewegwijzering stadspark, ontwerpfase',
          aantal: '1',
          prijs: '3400.00',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
      ],
    },
    {
      klant: klanten['De Groene Kas'],
      datum: d(8, 4),
      afhandeling: 'concept',
      regels: [
        {
          omschrijving: 'Ontwerpuren augustus',
          aantal: '18',
          prijs: '92.50',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
      ],
    },
    {
      klant: klanten['Praktijk Verheul'],
      datum: d(8, 20),
      soort: 'offerte',
      afhandeling: 'concept',
      regels: [
        {
          omschrijving: 'Herontwerp website, vaste prijs',
          aantal: '1',
          prijs: '4250.00',
          btwCodeId: btw21,
          rekeningId: omzet,
        },
      ],
    },
  ];
}

function inkoopwerk(leveranciers, r, b) {
  const in21 = b['IN-21'];
  const in9 = b['IN-9'];
  const geen = b['IN-GEEN'];

  return [
    {
      leverancier: leveranciers['Kantoorzaak Bosman'],
      datum: d(1, 9),
      omschrijving: 'Bureaustoel en verlichting',
      regels: [
        {
          omschrijving: 'Bureaustoel',
          aantal: '1',
          prijs: '389.00',
          btwCodeId: in21,
          rekeningId: r['4100'],
        },
      ],
    },
    {
      leverancier: leveranciers['HostingPunt'],
      datum: d(1, 31),
      omschrijving: 'Hosting eerste kwartaal',
      regels: [
        {
          omschrijving: 'Hosting en domeinen',
          aantal: '3',
          prijs: '29.00',
          btwCodeId: in21,
          rekeningId: r['4120'],
        },
      ],
    },
    {
      leverancier: leveranciers['Verzekeringen Zuidwal'],
      datum: d(2, 1),
      omschrijving: 'Beroepsaansprakelijkheid',
      regels: [
        {
          omschrijving: 'Jaarpremie',
          aantal: '1',
          prijs: '540.00',
          btwCodeId: geen,
          rekeningId: r['4320'],
        },
      ],
    },
    {
      leverancier: leveranciers['Kantoorzaak Bosman'],
      datum: d(3, 14),
      omschrijving: 'Kantoorartikelen',
      regels: [
        {
          omschrijving: 'Papier, mappen, toner',
          aantal: '1',
          prijs: '146.75',
          btwCodeId: in21,
          rekeningId: r['4100'],
        },
      ],
    },
    {
      leverancier: leveranciers['Boekhoudkantoor Meijer'],
      datum: d(4, 2),
      omschrijving: 'Aangifte eerste kwartaal',
      regels: [
        {
          omschrijving: 'Advies en aangifte',
          aantal: '2',
          prijs: '135.00',
          btwCodeId: in21,
          rekeningId: r['4310'],
        },
      ],
    },
    {
      leverancier: leveranciers['HostingPunt'],
      datum: d(4, 30),
      omschrijving: 'Hosting tweede kwartaal',
      regels: [
        {
          omschrijving: 'Hosting en domeinen',
          aantal: '3',
          prijs: '29.00',
          btwCodeId: in21,
          rekeningId: r['4120'],
        },
      ],
    },
    {
      leverancier: leveranciers['Kantoorzaak Bosman'],
      datum: d(5, 22),
      omschrijving: 'Reiskosten beursbezoek',
      regels: [
        {
          omschrijving: 'Vervoer en verblijf',
          aantal: '1',
          prijs: '212.40',
          btwCodeId: in9,
          rekeningId: r['4210'],
        },
      ],
    },
    {
      leverancier: leveranciers['HostingPunt'],
      datum: d(7, 31),
      omschrijving: 'Hosting derde kwartaal',
      regels: [
        {
          omschrijving: 'Hosting en domeinen',
          aantal: '3',
          prijs: '29.00',
          btwCodeId: in21,
          rekeningId: r['4120'],
        },
      ],
    },
  ];
}

// --- Uitvoeren -------------------------------------------------------------

async function vul(pad) {
  const { rekening, btw } = await registers(pad);

  meld('Relaties aanmaken ...');
  const klanten = {};
  for (const klant of KLANTEN) {
    const gemaakt = await moet('POST', `${pad}/relaties`, {
      ...klant,
      soort: 'klant',
    });
    klanten[klant.naam] = gemaakt.id;
  }
  const leveranciers = {};
  for (const leverancier of LEVERANCIERS) {
    const gemaakt = await moet('POST', `${pad}/relaties`, {
      ...leverancier,
      soort: 'leverancier',
      betalingstermijnDagen: 30,
    });
    leveranciers[leverancier.naam] = gemaakt.id;
  }

  meld('Verkoopfacturen maken en boeken ...');
  const teBetalen = [];
  for (const opdracht of verkoopwerk(klanten, rekening, btw)) {
    const factuur = await moet('POST', `${pad}/verkoopfacturen`, {
      contactId: opdracht.klant,
      soort: opdracht.soort ?? 'factuur',
      factuurdatum: opdracht.datum,
      regels: opdracht.regels,
    });
    if (opdracht.afhandeling === 'concept') continue;

    const definitief = await moet('POST', `${pad}/verkoopfacturen/${factuur.id}/definitief`);
    const gelezen = await moet('GET', `${pad}/verkoopfacturen/${factuur.id}`);

    if (opdracht.afhandeling === 'betaald' || opdracht.afhandeling === 'deels betaald') {
      teBetalen.push({
        nummer: definitief.documentnummer,
        naam: gelezen.factuur.contact_naam ?? 'Klant',
        iban: KLANTEN.find((k) => klanten[k.naam] === opdracht.klant)?.iban ?? 'NL02ABNA0123456789',
        bedrag: gelezen.factuur.totaal_inclusief,
        deels: opdracht.afhandeling === 'deels betaald',
        datum: opdracht.datum,
      });
    }
  }

  meld('Inkoopfacturen vastleggen ...');
  for (const opdracht of inkoopwerk(leveranciers, rekening, btw)) {
    const inkoop = await moet('POST', `${pad}/inkoopfacturen`, {
      contactId: opdracht.leverancier,
      factuurdatum: opdracht.datum,
      omschrijving: opdracht.omschrijving,
      regels: opdracht.regels,
    });
    await moet('POST', `${pad}/inkoopfacturen/${inkoop.id}/definitief`);
  }

  meld('Projecten en uren vastleggen ...');
  const projecten = [
    {
      naam: 'Huisstijl Bakkerij Jansen',
      klant: 'Bakkerij Jansen',
      uurtarief: '92.50',
      budgetMinuten: 4800,
      activiteiten: ['Ontwerp', 'Overleg', 'Reistijd'],
      uren: [
        { datum: d(6, 3), minuten: 480, activiteit: 'Ontwerp', wat: 'Eerste ontwerprichtingen' },
        { datum: d(6, 4), minuten: 300, activiteit: 'Ontwerp', wat: 'Uitwerking logo' },
        { datum: d(6, 5), minuten: 90, activiteit: 'Overleg', wat: 'Bespreking met de klant' },
        { datum: d(6, 5), minuten: 75, activiteit: 'Reistijd', wat: 'Heen en terug naar Elders' },
        { datum: d(6, 10), minuten: 420, activiteit: 'Ontwerp', wat: 'Verpakkingen en gevelbelettering' },
      ],
    },
    {
      naam: 'Bewegwijzering stadspark',
      klant: 'Gemeente Zuiderveld',
      uurtarief: '105.00',
      budgetMinuten: 9000,
      activiteiten: ['Ontwerp', 'Projectleiding'],
      uren: [
        { datum: d(7, 8), minuten: 450, activiteit: 'Ontwerp', wat: 'Schetsontwerp routepalen' },
        { datum: d(7, 9), minuten: 240, activiteit: 'Projectleiding', wat: 'Afstemming met de aannemer' },
        { datum: d(8, 12), minuten: 360, activiteit: 'Ontwerp', wat: 'Definitief ontwerp' },
        { datum: d(8, 13), minuten: 180, activiteit: 'Ontwerp', wat: 'Materiaalkeuze en detaillering' },
      ],
    },
    {
      naam: 'Intern: website en administratie',
      klant: null,
      uurtarief: null,
      facturatie: 'niet',
      budgetMinuten: null,
      activiteiten: [],
      uren: [
        { datum: d(8, 21), minuten: 120, activiteit: null, wat: 'Eigen website bijwerken' },
        { datum: d(8, 28), minuten: 90, activiteit: null, wat: 'Boekhouding bijwerken' },
      ],
    },
  ];

  const teFactureren = [];
  for (const opdracht of projecten) {
    const project = await moet('POST', `${pad}/projecten`, {
      naam: opdracht.naam,
      contactId: opdracht.klant ? klanten[opdracht.klant] : null,
      facturatie: opdracht.facturatie ?? 'uurtarief',
      uurtarief: opdracht.uurtarief,
      budgetMinuten: opdracht.budgetMinuten,
      btwCodeId: btw['VK-21'],
      rekeningId: rekening['8000'],
    });

    const activiteitIds = {};
    for (const naam of opdracht.activiteiten) {
      const activiteit = await moet('POST', `${pad}/projecten/${project.id}/activiteiten`, {
        naam,
        uurtarief: naam === 'Reistijd' ? '55.00' : null,
      });
      activiteitIds[naam] = activiteit.id;
    }

    for (const uur of opdracht.uren) {
      await moet('POST', `${pad}/uren`, {
        projectId: project.id,
        activiteitId: uur.activiteit ? activiteitIds[uur.activiteit] : null,
        datum: uur.datum,
        minuten: uur.minuten,
        omschrijving: uur.wat,
      });
    }

    if (opdracht.klant) teFactureren.push(project.id);
  }

  meld('Bankafschrift importeren ...');
  const bankrekeningen = await moet('GET', `${pad}/bankrekeningen`);
  const bankId = bankrekeningen.bankrekeningen[0].id;

  const regels = ['Datum;Bedrag;Af Bij;Tegenrekening;Naam tegenpartij;Omschrijving'];
  for (const betaling of teBetalen) {
    // Een deelbetaling van drie vijfde, exact verdeeld. Ook in een demoscript
    // gaat een bedrag nooit door een floating-pointberekening.
    const bedrag = betaling.deels
      ? Money.vanTekst(betaling.bedrag, 'EUR').verdeel([3, 2])[0].toString()
      : betaling.bedrag;
    const dag = new Date(`${betaling.datum}T00:00:00Z`);
    dag.setUTCDate(dag.getUTCDate() + 9);
    regels.push(
      [
        dag.toISOString().slice(0, 10),
        bedrag.replace('.', ','),
        'Bij',
        betaling.iban,
        betaling.naam,
        `Betaling factuur ${betaling.nummer}`,
      ].join(';'),
    );
  }
  // Twee uitgaven en een nog onbekende bijschrijving, zodat er ook werk
  // blijft liggen op het bankscherm.
  regels.push(`${d(2, 12)};470,69;Af;NL44RABO0123456789;Kantoorzaak Bosman;Factuur bureaustoel`);
  regels.push(`${d(5, 28)};105,30;Af;NL45INGB0987654321;HostingPunt;Hosting tweede kwartaal`);
  regels.push(`${d(8, 26)};640,00;Bij;NL08KNAB0009876543;Onbekende opdrachtgever;Aanbetaling project`);

  const invoer = await moet('POST', `${pad}/bankrekeningen/${bankId}/import`, {
    bestandsnaam: `afschrift-${jaar}.csv`,
    inhoud: regels.join('\n'),
  });
  meld(`  ${invoer.toegevoegd} transacties toegevoegd, ${invoer.overgeslagen} dubbel.`);

  meld('Betalingen afletteren op basis van de voorstellen ...');
  const transacties = await moet('GET', `${pad}/banktransacties?status=nieuw&limiet=100`);
  let geboekt = 0;
  for (const transactie of transacties.items) {
    const voorstellen = await moet('GET', `${pad}/banktransacties/${transactie.id}/voorstellen`);
    const beste = voorstellen.matches?.[0];
    if (!beste || beste.zekerheid < 0.8) continue;

    await moet('POST', `${pad}/banktransacties/${transactie.id}/boek`, {
      afletteringen: [
        {
          factuurSoort: beste.soort,
          factuurId: beste.factuurId,
          bedrag: transactie.bedrag,
        },
      ],
    });
    geboekt += 1;
  }
  meld(`  ${geboekt} van de ${transacties.items.length} transacties automatisch gekoppeld.`);

  // Uren indienen. Goedkeuren kan de eigenaar niet zelf: dat is functiescheiding
  // en dus blijft er in de demo bewust een stapel klaarstaan om te beoordelen.
  const geschreven = await moet('GET', `${pad}/uren?limiet=500`);
  const ids = geschreven.items.filter((uur) => uur.status === 'concept').map((uur) => uur.id);
  if (ids.length > 0) {
    const ingediend = await moet('POST', `${pad}/uren/indienen`, { ids });
    meld(`  ${ingediend.ingediend} uren ingediend ter beoordeling.`);
  }
  meld(`  ${teFactureren.length} projecten staan klaar om te factureren zodra de uren zijn goedgekeurd.`);
}

async function toon(pad) {
  const balans = await moet('GET', `${pad}/rapporten/balans?peildatum=${d(12, 31)}`);
  const wv = await moet('GET', `${pad}/rapporten/winst-en-verlies?vanaf=${d(1, 1)}&tot=${d(12, 31)}`);
  const btwOverzicht = await moet('GET', `${pad}/rapporten/btw?vanaf=${d(1, 1)}&tot=${d(12, 31)}`);
  const controle = await moet('GET', `${pad}/audit/controle`);

  meld('');
  meld('Resultaat van de demo-administratie:');
  meld(`  omzet          ${wv.totaalOpbrengsten}`);
  meld(`  kosten         ${wv.totaalKosten}`);
  meld(`  resultaat      ${wv.resultaat}`);
  meld(`  balans sluit   ${balans.inBalans ? 'ja' : 'NEE'}`);
  meld(`  btw sluit aan  ${btwOverzicht.aansluiting.sluitAan ? 'ja' : 'NEE'}`);
  meld(`  auditspoor     ${controle.ongeschonden ? 'ongeschonden' : 'ONDERBROKEN'}`);

  const projectoverzicht = await moet('GET', `${pad}/projecten-overzicht`);
  const minuten = projectoverzicht.projecten.reduce((totaal, p) => totaal + p.geschreven_minuten, 0);
  meld(`  uren           ${Math.floor(minuten / 60)}:${String(minuten % 60).padStart(2, '0')} op ${projectoverzicht.projecten.length} projecten`);
}

const gereed = await verzoek('GET', '/health/ready');
if (gereed.status !== 200) {
  meld(`De API op ${basis} antwoordt niet (status ${gereed.status}).`);
  meld('Start hem eerst met: npm run dev');
  process.exit(1);
}

await meldAan();
const pad = await maakAdministratie();
await vul(pad);
await toon(pad);

meld('');
meld('Klaar. Meld je aan op http://localhost:5173 met:');
meld(`  e-mailadres  ${EMAIL}`);
meld(`  wachtwoord   ${WACHTWOORD}`);
meld('');
meld('Alle gegevens hierin zijn verzonnen. Gebruik dit account nooit buiten een ontwikkelomgeving.');
