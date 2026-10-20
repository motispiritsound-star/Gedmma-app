/**
 * De Nederlandse interface, en de vorm waar elke andere taal zich aan houdt.
 *
 * `Teksten` wordt uit dit object afgeleid, zodat een vergeten of verkeerd
 * gespelde sleutel in het Duits, Frans of Engels een typefout is en geen
 * Nederlands woord op een Duits scherm.
 *
 * De merknaam staat hier nergens letterlijk: `{naam}` wordt door
 * `merknaam()` ingevuld. Zo hoeft geen van de vier taalbestanden opnieuw
 * langs een vertaler als de naam ooit wijzigt. `merk.test.ts` bewaakt het.
 */
export const nl = {
  algemeen: {
    verder: 'Verder',
    terug: 'Terug',
    sluiten: 'Sluiten',
    annuleren: 'Annuleren',
    overslaan: 'Overslaan',
    start: 'Beginnen',
    klaar: 'Klaar',
    nogEens: 'Nog eens',
    laden: 'Even geduld…',
    van: 'van',
    woorden: 'woorden',
    les: 'les',
    lessen: 'lessen',
    dagen: 'dagen',
    jaar: 'jaar',
  },

  nav: {
    leren: 'Leren',
    herhalen: 'Herhalen',
    woorden: 'Woorden',
    letters: 'Letters',
    jij: 'Jij',
    ouders: 'Ouders',
  },

  welkom: {
    titel: '{naam}',
    /** Dit is wat de naam betekent, en de belofte in één regel. */
    betekenis: '“Dilimiz” is Turks voor “onze taal”.',
    belofte: 'Turks leren, in korte lessen, om thuis en in Turkije te gebruiken.',
    /**
     * Deze regel lost het bezwaar bij de naam op: "onze" is een uitnodiging en
     * geen toelatingseis. Zie docs/brand-brief.md §De naam.
     */
    vooriedereen: 'Voor ieder kind dat Turks wil kunnen zeggen — of je het al begrijpt of nog helemaal niet, en wat je thuis verder ook spreekt.',
    kiesTaal: 'In welke taal wil je de app?',
    taalUitleg: 'Dit is de taal van de knoppen en de uitleg. Het Turks blijft Turks.',

    ouderKop: 'Eerst even voor de ouder',
    ouderIntro: 'Twee dingen die je moet weten voordat je kind begint.',
    ouderPrivacy: 'Alles blijft op dit toestel. Geen account, geen server, geen advertenties, geen tracking. Wij zien niets.',
    ouderBetalen: 'De eerste lessen zijn gratis. Daarna is er een abonnement, en dat gaat via de App Store of Google Play — altijd achter een ouderpoort, zodat je kind niets per ongeluk koopt.',
    ouderGelezen: 'Begrepen, ga verder',
    ouderMeer: 'Meer over privacy',

    naamKop: 'Hoe mag de app je noemen?',
    naamUitleg: 'Een voornaam of een bijnaam — wat je wil. Dit blijft op dit toestel en gaat nergens naartoe.',
    naamPlaceholder: 'Bijvoorbeeld Deniz',
    naamOverslaan: 'Liever niets invullen',
    naamLeeg: 'Vriend',

    avatarKop: 'Kies een plaatje',
    groepKop: 'Hoe oud ben je ongeveer?',
    groepUitleg: 'Dit bepaalt hoe lang een les duurt en hoe de app praat. Een ouder kan het later veranderen.',
    groepKlein: '4 tot 6',
    groepMidden: '7 tot 11',
    groepGroot: '12 en ouder',

    gereed: 'Klaar om te beginnen',
    gereedUitleg: 'De eerste les gaat over zes letters die je anders leest dan je gewend bent. Daarna kun je élk Turks woord voorlezen.',
  },

  pad: {
    kop: 'Jouw pad',
    vervolg: 'Verder waar je was',
    beginnen: 'Begin hier',
    opSlot: 'Nog op slot',
    opSlotUitleg: 'Maak de les ervoor af om deze te openen.',
    betaaldSlot: 'Hoort bij het abonnement',
    sterren: 'sterren',
    unitAf: 'Unit af!',
    gezinsopdracht: 'Doe dit samen',
  },

  les: {
    nieuwWoord: 'Een nieuw woord',
    nieuweLetter: 'Een nieuwe letter',
    nieuweZin: 'Een nieuwe zin',
    hoorHet: 'Hoor het',
    nogEens: 'Nog eens',
    watBetekent: 'Wat betekent dit?',
    hoeZegJe: 'Hoe zeg je dit in het Turks?',
    welkHoordeJe: 'Welke hoorde je?',
    typHet: 'Typ het in het Turks',
    zegHet: 'Zeg het hardop',
    zegHetUitleg: 'De microfoon gaat alleen aan als je op de knop drukt. Er wordt niets opgenomen en niets verstuurd.',
    bouwDeZin: 'Maak de zin',
    kiesAchtervoegsel: 'Welke past?',
    plakHetAan: 'Plak de stukjes aan elkaar',
    goed: 'Goed!',
    bijnaGoed: 'Bijna — het is:',
    fout: 'Het is:',
    hulpwoord: 'Dit woord krijg je erbij',
    volgende: 'Volgende',
    nakijken: 'Nakijken',
    lesKlaar: 'Les klaar!',
    lesKlaarGoed: 'goed van',
    nieuweWoorden: 'nieuwe woorden',
    verderLeren: 'Verder leren',
    naarPad: 'Terug naar het pad',
    tipKop: 'Wist je dit?',
    tipBegrepen: 'Snap ik',
    computerstem: 'Computerstem',
    computerstemUitleg: 'Dit woord is nog niet door een moedertaalspreker ingesproken. Wat je hoort is de stem van je telefoon, en die klinkt niet helemaal goed.',
  },

  herhalen: {
    kop: 'Herhalen',
    niksTeDoen: 'Niets te herhalen',
    niksTeDoenUitleg: 'Alles wat je geleerd hebt zit nog goed vast. Kom morgen terug, of doe een nieuwe les.',
    klaarVoor: 'klaar om te herhalen',
    startRonde: 'Begin de ronde',
    uitleg: 'Woorden komen terug net voordat je ze dreigt te vergeten. Dat is het hele idee.',
  },

  woordenlijst: {
    kop: 'Jouw woorden',
    leeg: 'Nog geen woorden. Doe eerst een les.',
    zoek: 'Zoeken',
    sterkte: {
      vast: 'Zit vast',
      sterk: 'Sterk',
      bijna: 'Bijna',
      wankel: 'Wankel',
      nieuw: 'Nieuw',
    },
    opSlot: 'Hoort bij het abonnement',
  },

  alfabet: {
    kop: 'Het Turkse alfabet',
    uitleg: '29 letters, en geen q, w of x. Zes ervan lees je anders dan je gewend bent — die staan hier bovenaan.',
    lastig: 'Deze zes gaan het vaakst mis',
    rest: 'De rest, die je al kent',
    klinkt: 'Klinkt',
    voorbeeld: 'Bijvoorbeeld',
    hoofdletter: 'Hoofdletter',
  },

  profiel: {
    kop: 'Jij',
    xp: 'punten',
    reeks: 'dagen op rij',
    besteReeks: 'beste reeks',
    geleerd: 'woorden geleerd',
    lessenAf: 'lessen af',
    instellingen: 'Instellingen',
    naarOuders: 'Voor ouders',
  },

  instellingen: {
    kop: 'Instellingen',
    taal: 'Taal van de app',
    kleur: 'Kleur',
    thema: 'Licht of donker',
    themaSysteem: 'Zoals mijn telefoon',
    themaLicht: 'Licht',
    themaDonker: 'Donker',
    geluid: 'Geluid',
    spreken: 'Spreekoefeningen',
    sprekenUitleg: 'Er wordt niets opgenomen en niets verstuurd.',
    typen: 'Tikoefeningen',
    beweging: 'Minder beweging',
    lezen: 'Makkelijker te lezen letters',
    kleuren: {
      blauw: 'Blauw',
      abrikoos: 'Abrikoos',
      groen: 'Groen',
      roze: 'Roze',
    },
  },

  ouderpoort: {
    kop: 'Even voor de ouder',
    uitleg: 'Wat hierachter staat is voor een volwassene. Reken dit uit om verder te gaan.',
    vraag: 'Hoeveel is',
    fout: 'Dat is niet goed. Probeer nog eens.',
    terug: 'Terug naar de app',
  },

  ouders: {
    kop: 'Voor ouders',
    intro: 'Alles over wat de app bewaart, wat die niet doet, en hoe het abonnement werkt.',

    voortgangKop: 'Hoe gaat het?',
    voortgangLeeg: 'Er is nog niets gedaan. Dat komt.',
    woordenGeleerd: 'woorden geleerd',
    lessenAf: 'lessen af',
    dagenOpRij: 'dagen op rij',
    sterkWoorden: 'woorden zitten vast',

    privacyKop: 'Privacy',
    privacyKort: 'Deze app verzamelt niets. Alles staat op dit toestel: de naam die je kind koos, de voortgang en de instellingen. Er is geen account en geen server, dus er is ook geen plek waar het heen kan.',
    privacyGeenAds: 'Geen advertenties en geen tracking. Niet van ons en niet van iemand anders.',
    privacyGeenOpname: 'De spreekoefening werkt op het toestel. Er wordt niets opgeslagen en niets verstuurd.',

    gegevensKop: 'Jouw gegevens',
    bekijken: 'Bekijken',
    bekijkenUitleg: 'Toon letterlijk alles wat is opgeslagen.',
    meenemen: 'Meenemen',
    meenemenUitleg: 'Bewaar het als bestand, bijvoorbeeld voor een nieuw toestel.',
    terugzetten: 'Terugzetten',
    terugzettenUitleg: 'Lees een eerder meegenomen bestand terug.',
    terugzettenGelukt: 'Teruggezet.',
    terugzettenMislukt: 'Dat bestand kon niet gelezen worden.',
    verwijderen: 'Alles verwijderen',
    verwijderenUitleg: 'Wist de voortgang, de naam en de instellingen van dit toestel.',
    verwijderenZeker: 'Alles verwijderen? Dit kan niet teruggedraaid worden.',
    verwijderenNietAbonnement: 'Een lopend abonnement blijft bestaan: dat staat bij Apple of Google en niet bij ons. Opzeggen doe je daar.',
    verwijderd: 'Alles is gewist.',

    inhoudKop: 'Over de lesinhoud',
    inhoudNagekeken: 'De Turkse inhoud is nagekeken door een moedertaalspreker.',
    inhoudNogNiet: 'Let op: de Turkse inhoud is nog niet nagekeken door een moedertaalspreker. Deze app is in ontwikkeling.',

    audioKop: 'Over het geluid',
    audioComputerstem: 'Een deel van de woorden wordt nog voorgelezen door de stem van je telefoon in plaats van door een moedertaalspreker. Dat hoor je, en het klopt niet altijd.',

    herinneringKop: 'Dagelijkse herinnering',
    herinneringUitleg: 'Eén melding per dag, op een tijd die jij kiest. Staat uit tot je hem aanzet.',
    herinneringTijd: 'Hoe laat',
  },

  abonnement: {
    kop: 'De hele cursus',
    intro: 'De eerste {gratis} lessen zijn gratis, voor altijd. De rest hoort bij het abonnement.',
    proef: '{dagen} dagen gratis, daarna {prijs}',
    proefUitleg: 'Je betaalt niets in de eerste {dagen} dagen. Zeg je in die tijd op, dan wordt er niets afgeschreven.',
    perJaar: 'per jaar',
    perMaand: 'per maand',
    perMaandBijJaar: 'komt neer op {prijs} per maand',
    besteKeuze: 'Voordeligste',
    kies: 'Kiezen',
    verlenging: 'Het abonnement verlengt automatisch tot je opzegt.',
    opzeggen: 'Opzeggen kan altijd, in de instellingen van je telefoon. Zeg je op vóór het einde van de periode, dan loopt het door tot die datum en stopt het daarna.',
    viaWinkel: 'De betaling loopt via {winkel}. Wij krijgen geen gegevens van je betaalmiddel te zien.',
    herstel: 'Al eerder gekocht? Herstellen',
    herstelGelukt: 'Je abonnement is teruggezet.',
    herstelNiets: 'Er is geen eerdere aankoop gevonden op dit account.',
    nietBeschikbaar: 'Kopen kan alleen in de app uit de App Store of Google Play.',
    actief: 'Je abonnement loopt.',
    actiefSinds: 'Actief sinds',
    inProef: 'Je proefperiode loopt nog {dagen} dagen.',
    verlopen: 'Je abonnement is afgelopen. De gratis lessen blijven open.',
    verlopenHervat: 'Opnieuw nemen',
    bezig: 'Bezig met de winkel…',
    mislukt: 'Dat is niet gelukt. Er is niets afgeschreven.',
  },

  fout: {
    kop: 'Daar ging iets mis',
    uitleg: 'Je voortgang staat veilig op dit toestel. Probeer de app opnieuw te openen.',
    opnieuw: 'Opnieuw proberen',
  },
}

/**
 * De vorm waar de andere talen zich aan houden.
 *
 * Geen `as const` op `nl`: dan zouden de letterlijke Nederlandse woorden het
 * type worden en zou elke vertaling een typefout zijn. Dit is de vorm, niet de
 * inhoud.
 */
export type Teksten = typeof nl
