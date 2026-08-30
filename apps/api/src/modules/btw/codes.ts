/**
 * De standaard-btw-codes voor een Nederlandse administratie.
 *
 * Belangrijk: dit zijn *startgegevens*, geen regels in code. Ze worden bij het
 * aanmaken van een administratie in `tax_code` gezet, met een geldigheidsdatum.
 * Wijzigt een tarief, dan komt er een rij bij met een nieuwe `geldigVanaf`; de
 * oude rij krijgt een `geldigTot`. Bestaande boekingen blijven verwijzen naar de
 * code die op hun boekdatum gold.
 *
 * De vaknummers verwijzen naar de Nederlandse aangifte omzetbelasting. Bron,
 * versie en datum van raadpleging staan in docs/legal-source-register.md. Dit is
 * geen fiscaal advies; controleer de actuele indeling bij de Belastingdienst.
 */
export type BtwCodeSjabloon = {
  code: string;
  naam: string;
  soort: 'verkoop' | 'inkoop' | 'beide';
  /** Tarief als verhouding, als tekst: '0.210000' voor 21%. */
  tarief: string;
  vak: string | null;
  verlegd: boolean;
  icLevering: boolean;
  geldigVanaf: string;
  geldigTot: string | null;
  /** Code van de grootboekrekening waarop de btw wordt geboekt. */
  rekeningCode?: string;
  /** Uitleg in gewone taal, getoond bij de keuze. */
  uitleg: string;
};

export const STANDAARD_BTWCODES: readonly BtwCodeSjabloon[] = [
  {
    code: 'VK-21',
    naam: 'Verkoop 21% (hoog tarief)',
    soort: 'verkoop',
    tarief: '0.210000',
    vak: '1a',
    verlegd: false,
    icLevering: false,
    geldigVanaf: '2012-10-01',
    geldigTot: null,
    rekeningCode: '1500',
    uitleg: 'Het gewone tarief voor de meeste producten en diensten.',
  },
  {
    code: 'VK-9',
    naam: 'Verkoop 9% (laag tarief)',
    soort: 'verkoop',
    tarief: '0.090000',
    vak: '1b',
    verlegd: false,
    icLevering: false,
    geldigVanaf: '2019-01-01',
    geldigTot: null,
    rekeningCode: '1505',
    uitleg: 'Voor onder meer eten, boeken, medicijnen en sommige diensten.',
  },
  {
    code: 'VK-0',
    naam: 'Verkoop 0% of vrijgesteld',
    soort: 'verkoop',
    tarief: '0.000000',
    vak: '1e',
    verlegd: false,
    icLevering: false,
    geldigVanaf: '2012-10-01',
    geldigTot: null,
    uitleg: 'Je rekent geen btw. Zet op de factuur waarom: welke vrijstelling of welk 0%-geval het is.',
  },
  {
    code: 'VK-VERLEGD',
    naam: 'Verkoop btw verlegd',
    soort: 'verkoop',
    tarief: '0.210000',
    vak: '1e',
    verlegd: true,
    icLevering: false,
    geldigVanaf: '2012-10-01',
    geldigTot: null,
    uitleg: 'Je klant draagt de btw af, bijvoorbeeld bij onderaanneming in de bouw. Vermeld "btw verlegd" en het btw-nummer van je klant.',
  },
  {
    code: 'VK-ICL',
    naam: 'Levering naar een ander EU-land',
    soort: 'verkoop',
    tarief: '0.000000',
    vak: '3b',
    verlegd: false,
    icLevering: true,
    geldigVanaf: '2012-10-01',
    geldigTot: null,
    uitleg: 'Levering aan een ondernemer in een ander EU-land. Komt ook in je ICP-opgave; het btw-nummer van je klant is verplicht.',
  },
  {
    code: 'VK-EXPORT',
    naam: 'Uitvoer buiten de EU',
    soort: 'verkoop',
    tarief: '0.000000',
    vak: '3a',
    verlegd: false,
    icLevering: false,
    geldigVanaf: '2012-10-01',
    geldigTot: null,
    uitleg: 'Je levert aan een land buiten de EU; bewaar het uitvoerbewijs.',
  },
  {
    code: 'VK-GEEN',
    naam: 'Verkoop zonder btw',
    soort: 'verkoop',
    tarief: '0.000000',
    vak: null,
    verlegd: false,
    icLevering: false,
    geldigVanaf: '2012-10-01',
    geldigTot: null,
    uitleg: 'Voor posten die buiten de btw vallen, zoals rente.',
  },
  {
    code: 'IN-21',
    naam: 'Inkoop 21%',
    soort: 'inkoop',
    tarief: '0.210000',
    vak: '5b',
    verlegd: false,
    icLevering: false,
    geldigVanaf: '2012-10-01',
    geldigTot: null,
    rekeningCode: '1520',
    uitleg: 'Btw die je zelf hebt betaald en terugkrijgt.',
  },
  {
    code: 'IN-9',
    naam: 'Inkoop 9%',
    soort: 'inkoop',
    tarief: '0.090000',
    vak: '5b',
    verlegd: false,
    icLevering: false,
    geldigVanaf: '2019-01-01',
    geldigTot: null,
    rekeningCode: '1520',
    uitleg: 'Btw tegen het lage tarief die je terugkrijgt.',
  },
  {
    code: 'IN-VERLEGD',
    naam: 'Inkoop btw verlegd naar mij',
    soort: 'inkoop',
    tarief: '0.210000',
    vak: '2a',
    verlegd: true,
    icLevering: false,
    geldigVanaf: '2012-10-01',
    geldigTot: null,
    uitleg: 'De leverancier rekent geen btw; jij draagt hem af en trekt hem in dezelfde aangifte weer af. Per saldo betaal je niets extra.',
  },
  {
    code: 'IN-EU',
    naam: 'Inkoop uit een ander EU-land',
    soort: 'inkoop',
    tarief: '0.210000',
    vak: '4b',
    verlegd: true,
    icLevering: false,
    geldigVanaf: '2012-10-01',
    geldigTot: null,
    uitleg: 'Verwerving van goederen uit de EU. Ook hier: afdragen en in dezelfde aangifte aftrekken.',
  },
  {
    code: 'IN-GEEN',
    naam: 'Inkoop zonder btw',
    soort: 'inkoop',
    tarief: '0.000000',
    vak: null,
    verlegd: false,
    icLevering: false,
    geldigVanaf: '2012-10-01',
    geldigTot: null,
    uitleg: 'Voor kosten zonder btw, zoals verzekeringen, bankkosten en loon.',
  },
];
