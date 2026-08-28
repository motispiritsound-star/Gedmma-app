import type { Film } from './types';

/**
 * De filmpjes worden in de app zelf getekend en geanimeerd: geen videobestanden,
 * dus geen laadtijd, geen datakosten en het werkt offline. Zodra er echt
 * getekende video's zijn, zet je de URL in `videoUrl` en speelt de speler die af.
 */
export const FILMS: Film[] = [
  {
    id: 'welkom',
    titel: 'Hoi, ik ben Vos',
    pitch: 'Waar deze app voor is, in een halve minuut.',
    vak: 'algemeen',
    soort: 'motivatie',
    beelden: [
      { duurMs: 3400, uitdrukking: 'blij', kop: 'Hoi!', tekst: 'Ik ben Vos. Ik ga elke dag een paar minuten met je oefenen.' },
      { duurMs: 4200, uitdrukking: 'wijs', kop: 'Kort maar vaak', tekst: 'Tien minuten per dag helpt meer dan twee uur op zondag. Je hersenen onthouden beter in kleine stukjes.' },
      { duurMs: 4200, uitdrukking: 'denk', kop: 'Ik let op je', tekst: 'Gaat iets makkelijk? Dan maak ik het moeilijker. Gaat het stroef? Dan doen we een stapje terug.', tint: 'slot' },
      { duurMs: 3600, uitdrukking: 'juich', kop: 'Zullen we?', tekst: 'Kies een vak en we beginnen gewoon.', tint: 'goed' },
    ],
  },
  {
    id: 'fout-is-goed',
    titel: 'Fout is niet erg',
    pitch: 'Waarom je juist van fouten leert.',
    vak: 'algemeen',
    soort: 'motivatie',
    beelden: [
      { duurMs: 3600, uitdrukking: 'troost', kop: 'Fout gehad?', tekst: 'Dat voelt even stom. Dat is normaal.', tint: 'fout' },
      { duurMs: 4600, uitdrukking: 'wijs', kop: 'Wat er dan gebeurt', tekst: 'Op het moment dat je merkt dat iets fout was, gaat je brein juist harder werken. Daar leer je meer van dan van tien keer goed.' },
      { duurMs: 4200, uitdrukking: 'denk', kop: 'Daarom die uitleg', tekst: 'Bij elk fout antwoord laat ik zien hóé het wel moet. Lees dat even. Dat is het belangrijkste stukje.', tint: 'slot' },
      { duurMs: 3400, uitdrukking: 'juich', kop: 'Dus:', tekst: 'Alles goed is fijn. Iets fout is leren.', tint: 'goed' },
    ],
  },
  {
    id: 'breinspier',
    titel: 'Je brein is een spier',
    pitch: 'Oefenen verandert echt iets in je hoofd.',
    vak: 'algemeen',
    soort: 'motivatie',
    beelden: [
      { duurMs: 3800, uitdrukking: 'denk', kop: 'Even eerlijk', tekst: 'Niemand wordt geboren met de tafel van 7 in zijn hoofd.' },
      { duurMs: 4600, uitdrukking: 'wijs', kop: 'Paadjes', tekst: 'Elke keer dat je iets oefent, wordt een paadje in je hoofd een beetje breder. Eerst een smal weggetje, later een snelweg.' },
      { duurMs: 4200, uitdrukking: 'blij', kop: 'Daarom gaat het vanzelf', tekst: 'Wat je eerst moest uitrekenen, weet je op een dag gewoon. Dat is niet omdat je slim geboren bent — dat is het paadje.', tint: 'goud' },
      { duurMs: 3400, uitdrukking: 'juich', kop: 'Nog niet', tekst: 'Zeg dus niet "ik kan het niet". Zeg "ik kan het nóg niet".', tint: 'goed' },
    ],
  },
  {
    id: 'volhouden',
    titel: 'Elke dag een beetje',
    pitch: 'Hoe een reeks je vooruit helpt.',
    vak: 'algemeen',
    soort: 'motivatie',
    beelden: [
      { duurMs: 3600, uitdrukking: 'blij', kop: 'De vlam', tekst: 'Voor elke dag dat je oefent, gaat je reeks één omhoog.', tint: 'goud' },
      { duurMs: 4400, uitdrukking: 'wijs', kop: 'Waarom dat werkt', tekst: 'Niet omdat het getal belangrijk is, maar omdat een gewoonte pas ontstaat als je hem een paar weken volhoudt.' },
      { duurMs: 4200, uitdrukking: 'troost', kop: 'Dag gemist?', tekst: 'Eén dag overslaan mag. Je reeks blijft staan. Pas na twee dagen begint hij opnieuw — en dat is ook niet erg.', tint: 'slot' },
      { duurMs: 3400, uitdrukking: 'juich', kop: 'Vandaag telt', tekst: 'Tien vragen zijn genoeg. Echt.', tint: 'goed' },
    ],
  },
  {
    id: 'tafels',
    titel: 'Tafels slim leren',
    pitch: 'Je hoeft er maar een paar echt uit je hoofd te kennen.',
    vak: 'rekenen',
    onderwerpId: 'rekenen.tafels',
    soort: 'uitleg',
    beelden: [
      { duurMs: 3600, uitdrukking: 'denk', kop: '100 sommen?', tekst: 'De tafels van 1 tot 10 lijken honderd sommen. Dat valt mee.' },
      {
        duurMs: 6000,
        uitdrukking: 'wijs',
        kop: 'Omdraaien mag',
        tekst: '7 × 3 en 3 × 7 zijn hetzelfde. Dat scheelt meteen de helft.',
        stappen: ['7 × 3 = 21', '3 × 7 = 21', 'Ken je er één, dan ken je er twee'],
      },
      {
        duurMs: 6400,
        uitdrukking: 'blij',
        kop: 'Bouw op wat je weet',
        tekst: 'De tafel van 9 is de tafel van 10, min één keer het getal.',
        stappen: ['9 × 6 = ?', '10 × 6 = 60', '60 − 6 = 54'],
        tint: 'goed',
      },
      { duurMs: 4000, uitdrukking: 'juich', kop: 'Wat overblijft', tekst: 'Uiteindelijk zijn er maar een handvol sommen die je echt uit je hoofd moet leren. 6×7, 7×8, 8×9. Die oefenen we vaker.', tint: 'goud' },
    ],
  },
  {
    id: 'kofschip',
    titel: "'t Kofschip",
    pitch: 'Wanneer schrijf je -te en wanneer -de?',
    vak: 'taal',
    onderwerpId: 'taal.werkwoorden',
    soort: 'uitleg',
    beelden: [
      { duurMs: 3800, uitdrukking: 'denk', kop: 'Werkte of werkde?', tekst: 'Je hoort het verschil bijna niet. Toch is er een regel.' },
      {
        duurMs: 6200,
        uitdrukking: 'wijs',
        kop: 'Kijk naar de stam',
        tekst: 'Neem het hele werkwoord, haal -en eraf. Dat is de stam.',
        stappen: ['werken → werk', 'spelen → speel', 'fietsen → fiets'],
      },
      {
        duurMs: 6600,
        uitdrukking: 'blij',
        kop: "Zit de laatste letter in 't kofschip?",
        tekst: 'De letters van ’t kofschip zijn t, k, f, s, ch en p. Zit de laatste letter van de stam daarin, dan wordt het -te. Anders -de.',
        stappen: ['werk → k zit erin → werkte', 'speel → l zit er niet in → speelde', 'fiets → s zit erin → fietste'],
        tint: 'slot',
      },
      { duurMs: 4200, uitdrukking: 'juich', kop: 'Één zinnetje', tekst: 'Onthoud: ’t kofschip. Zes letters, en je hebt de hele regel te pakken.', tint: 'goed' },
    ],
  },
  {
    id: 'breuken',
    titel: 'Wat is een breuk eigenlijk?',
    pitch: 'Met een pizza is het ineens logisch.',
    vak: 'rekenen',
    onderwerpId: 'rekenen.breuken',
    soort: 'uitleg',
    beelden: [
      { duurMs: 3800, uitdrukking: 'blij', kop: 'Een pizza', tekst: 'Stel je snijdt een pizza in vier gelijke stukken.' },
      {
        duurMs: 6000,
        uitdrukking: 'wijs',
        kop: 'Onder en boven',
        tekst: 'Onder de streep staat in hoeveel stukken je hebt gesneden. Boven de streep hoeveel je er hebt.',
        stappen: ['4 stukken → onder de streep de 4', 'Jij eet er 3 → boven de streep de 3', 'Samen: 3/4'],
      },
      {
        duurMs: 6200,
        uitdrukking: 'denk',
        kop: 'Groter of kleiner?',
        tekst: 'Hoe meer stukken je snijdt, hoe kleiner elk stuk. Daarom is 1/8 kleiner dan 1/4, ook al is 8 een groter getal.',
        stappen: ['1/2 is een half', '1/4 is de helft daarvan', '1/8 is nog kleiner'],
        tint: 'slot',
      },
      { duurMs: 4000, uitdrukking: 'juich', kop: 'Vanaf nu', tekst: 'Denk bij elke breuk aan die pizza. Dan zie je meteen wat er staat.', tint: 'goed' },
    ],
  },
  {
    id: 'lezen-aanpak',
    titel: 'Een moeilijke tekst aanpakken',
    pitch: 'Drie stappen die altijd werken.',
    vak: 'lezen',
    onderwerpId: 'lezen.begrijpend',
    soort: 'uitleg',
    beelden: [
      { duurMs: 3800, uitdrukking: 'denk', kop: 'Lang stuk tekst', tekst: 'Beginnen bij het eerste woord en hopen dat je het snapt, werkt meestal niet.' },
      {
        duurMs: 6400,
        uitdrukking: 'wijs',
        kop: 'Kijk eerst, lees dan',
        tekst: 'Bekijk de titel en de eerste zin van elke alinea. Dan weet je waar het over gaat voordat je begint.',
        stappen: ['1. Titel lezen', '2. Eerste zinnen scannen', '3. Pas dan echt lezen'],
      },
      {
        duurMs: 6200,
        uitdrukking: 'blij',
        kop: 'Zoek het antwoord terug',
        tekst: 'Bij een vraag hoort bijna altijd één zin in de tekst. Zoek die zin op in plaats van te gokken.',
        stappen: ['Welk woord uit de vraag staat in de tekst?', 'Lees die zin, en de zin ervoor', 'Daar staat je antwoord'],
        tint: 'slot',
      },
      { duurMs: 4000, uitdrukking: 'juich', kop: 'Werkt altijd', tekst: 'Deze drie stappen helpen bij elke tekst, ook bij de Cito-toets.', tint: 'goed' },
    ],
  },
  {
    id: 'procenten',
    titel: 'Procenten in de winkel',
    pitch: 'Van 25% korting naar wat je echt betaalt.',
    vak: 'rekenen',
    onderwerpId: 'rekenen.procenten',
    soort: 'uitleg',
    beelden: [
      { duurMs: 3600, uitdrukking: 'blij', kop: 'Procent = per honderd', tekst: '"Procent" betekent letterlijk: van elke honderd.' },
      {
        duurMs: 6200,
        uitdrukking: 'wijs',
        kop: 'Eerst 1%, dan de rest',
        tekst: 'Deel door 100, dan heb je 1%. Daarna keer het percentage dat je zoekt.',
        stappen: ['25% van 80', '80 : 100 = 0,80', '0,80 × 25 = 20'],
      },
      {
        duurMs: 6400,
        uitdrukking: 'denk',
        kop: 'Korting is niet de prijs',
        tekst: 'De korting is 20 euro. Wat je betaalt is wat er overblijft.',
        stappen: ['Prijs: €80', 'Korting: €20', 'Je betaalt: €60'],
        tint: 'slot',
      },
      { duurMs: 4000, uitdrukking: 'juich', kop: 'Handig weetje', tekst: '50% is de helft, 25% is de helft van de helft, en 10% is gewoon een komma opschuiven.', tint: 'goud' },
    ],
  },
];

export function vindFilm(id: string): Film | undefined {
  return FILMS.find((f) => f.id === id);
}

export function filmsVoorOnderwerp(onderwerpId: string): Film[] {
  return FILMS.filter((f) => f.onderwerpId === onderwerpId);
}

export function motivatieFilms(): Film[] {
  return FILMS.filter((f) => f.soort === 'motivatie');
}
