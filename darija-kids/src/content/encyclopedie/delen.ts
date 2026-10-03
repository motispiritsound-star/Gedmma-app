/**
 * De delen van Marokko 360° en van al-Andalus.
 *
 * Dit is een redactionele indeling en geen geschiedkundige: perioden lopen in
 * elkaar over, dynastieën overlappen, en een deel is een leeseenheid. Waar een
 * grens omstreden is, zegt `omvat` dat.
 *
 * **Deze indeling is een voorstel en nog niet vastgesteld.** De opdracht vraagt
 * de indeling pas vast te stellen ná onderzoek, en dat onderzoek kan in deze
 * omgeving niet gedaan worden — zie de toelichting in `bronnen.ts`. Wat hier
 * staat is de thematische dekking uit de opdracht, omgezet in leeseenheden,
 * met per deel de reden waarom de grens daar ligt. Twee plekken waar ik anders
 * zou indelen dan de opdracht voorstelt, staan in
 * `docs/MAROKKO360_REDACTIONEEL.md` met de afweging erbij.
 *
 * De nummers zijn stabiel: een hoofdstuk verwijst ernaar. Verschuift de
 * indeling, dan verschuiven de id's niet mee.
 */

import type { Deel } from './types'

export const DELEN: Deel[] = [
  {
    id: 'm1',
    reeks: 'marokko',
    nummer: 1,
    titel: 'Het land en zijn vroegste bewoners',
    periode: 'tot ± 1000 v.Chr.',
    omvat: 'Landschap, klimaat en archeologie: wat de bodem zegt over wie hier '
      + 'woonde voordat er geschreven werd. Begint bij het landschap zelf, omdat '
      + 'de Atlas, de Rif, de Souss en de Sahara de rest van de reeks verklaren.',
  },
  {
    id: 'm2',
    reeks: 'marokko',
    nummer: 2,
    titel: 'Mauretanië, Carthago en Rome',
    periode: '± 1000 v.Chr. – 5e eeuw',
    omvat: 'Fenicische en Punische contacten langs de kust, het koninkrijk '
      + 'Mauretanië, de Romeinse provincie Mauretania Tingitana en de steden die '
      + 'daarbij horen. Loopt door tot de stad ophoudt Romeins te zijn, niet tot '
      + 'een politieke datum: dat is wat de opgravingen laten zien.',
  },
  {
    id: 'm3',
    reeks: 'marokko',
    nummer: 3,
    titel: 'De eerste islamitische eeuwen en het ontstaan van Fes',
    periode: '7e – 10e eeuw',
    omvat: 'De komst van de islam, de vroege dynastieën, en Fes van nederzetting '
      + 'tot stad. Hier hoort ook wat er mét de oudere bevolking gebeurde: dit is '
      + 'geen leeg land dat opnieuw begint.',
  },
  {
    id: 'm4',
    reeks: 'marokko',
    nummer: 4,
    titel: 'De Almoraviden, de Sahara en Marrakech',
    periode: '11e – 12e eeuw',
    omvat: 'Een beweging die uit het zuiden komt, de trans-Saharahandel die haar '
      + 'draagt, en de stad die eruit voortkomt. De handelsroutes zijn hier geen '
      + 'achtergrond maar de hoofdzaak.',
  },
  {
    id: 'm5',
    reeks: 'marokko',
    nummer: 5,
    titel: 'De Almohaden in de Maghreb en al-Andalus',
    periode: '12e – 13e eeuw',
    omvat: 'Een rijk dat beide kanten van de Straat besloeg. Verwijst vooruit naar '
      + 'de al-Andalus-reeks in plaats van die over te doen.',
  },
  {
    id: 'm6',
    reeks: 'marokko',
    nummer: 6,
    titel: 'De Mariniden: Fes, onderwijs en de stad',
    periode: '13e – 15e eeuw',
    omvat: 'Madrasa’s, architectuur en stedelijke groei. Het deel waarin kennis en '
      + 'onderwijs het verhaal dragen in plaats van veldslagen.',
  },
  {
    id: 'm7',
    reeks: 'marokko',
    nummer: 7,
    titel: 'Een eeuw van breuken: kusten, havens en nieuwe machten',
    periode: '15e – 16e eeuw',
    omvat: 'De late middeleeuwen en vroege moderne tijd: Portugese en Spaanse '
      + 'vestigingen aan de kust, regionale machten binnenland, en de vraag wie '
      + 'de havens beheerst. In de opdracht heet dit deel "politieke en regionale '
      + 'veranderingen"; dat is een lege titel voor een eeuw waarin juist de kust '
      + 'alles bepaalt.',
  },
  {
    id: 'm8',
    reeks: 'marokko',
    nummer: 8,
    titel: 'De Saadiërs: Marrakech, suiker en goud',
    periode: '16e – begin 17e eeuw',
    omvat: 'Handel, bouwwerken en de veldslagen die de bronnen werkelijk dragen. '
      + 'Wat over de slag bij Ksar el-Kebir en over de tocht naar Songhai gezegd '
      + 'wordt, hoort hier met bronnen en met de twijfel erbij.',
  },
  {
    id: 'm9',
    reeks: 'marokko',
    nummer: 9,
    titel: 'De Alaouieten, Meknes en de vorming van een staat',
    periode: '17e – 18e eeuw',
    omvat: 'Staatsvorming, diplomatie met Europa en de Atlantische wereld, en de '
      + 'bouw van Meknes.',
  },
  {
    id: 'm10',
    reeks: 'marokko',
    nummer: 10,
    titel: 'De negentiende eeuw: handel, hervorming en druk van buiten',
    periode: '1800 – 1912',
    omvat: 'Steden, handelsverdragen, hervormingspogingen en de groeiende '
      + 'Europese aanwezigheid die uitloopt op het protectoraat.',
  },
  {
    id: 'm11',
    reeks: 'marokko',
    nummer: 11,
    titel: 'Protectoraat, verzet en onafhankelijkheid',
    periode: '1912 – 1956',
    omvat: 'Het Franse en het Spaanse protectoraat, de Rif, regionale '
      + 'geschiedenissen die niet in één nationaal verhaal passen, en de weg naar '
      + '1956.',
  },
  {
    id: 'm12',
    reeks: 'marokko',
    nummer: 12,
    titel: 'Sinds 1956: samenleving, steden en diaspora',
    periode: '1956 – nu',
    omvat: 'Politiek, stedelijke groei, migratie en de gemeenschappen buiten '
      + 'Marokko. Het deel dat het dichtst bij de lezer staat en daarom de meeste '
      + 'terughoudendheid vraagt: geen partij kiezen, wel laten zien waarover '
      + 'gestreden wordt.',
  },
  {
    id: 'm13',
    reeks: 'marokko',
    nummer: 13,
    titel: 'Steden en plaatsen door de eeuwen heen',
    omvat: 'Thematisch. Per stad de hele tijdlijn achter elkaar, voor de lezer die '
      + 'vanuit een plaats binnenkomt in plaats van vanuit een eeuw.',
  },
  {
    id: 'm14',
    reeks: 'marokko',
    nummer: 14,
    titel: 'Regio’s, landschappen en routes',
    omvat: 'Thematisch. Rif, Atlas, Souss, Atlantische kust, oases, Sahara en de '
      + 'routes ertussen. Hier staan de geschiedenissen die wegvallen zodra je '
      + 'per dynastie indeelt.',
  },
  {
    id: 'm15',
    reeks: 'marokko',
    nummer: 15,
    titel: 'Mensen, talen, kennis en dagelijks leven',
    omvat: 'Thematisch. Gemeenschappen, talen, religie, ambacht, landbouw, '
      + 'architectuur, wetenschap en het gewone leven — het deel waarin de '
      + 'encyclopedie over mensen gaat in plaats van over heersers.',
  },

  {
    id: 'a1',
    reeks: 'andalus',
    nummer: 1,
    titel: 'Al-Andalus: wat het was en hoe het werd',
    omvat: 'Begint met de vraag wat "al-Andalus" in de bronnen betekent, hoe dat '
      + 'per periode en per auteur verschilt, en waarom het niet hetzelfde is als '
      + 'het huidige Andalusië. Daarna de Iberische geschiedenis zelf.',
  },
  {
    id: 'a2',
    reeks: 'andalus',
    nummer: 2,
    titel: 'Over de Straat: steden, kennis en gemeenschappen',
    omvat: 'Steden, geleerden, bouwkunst en de gemeenschappen die er woonden, en '
      + 'de verbindingen met Noord-Afrika zonder al-Andalus tot voorgeschiedenis '
      + 'van Marokko te maken. De afbakening tussen deel 1 en 2 staat nog niet '
      + 'vast: die hoort uit het onderzoek te komen, niet uit een ronde verdeling.',
  },
]

export const deelVan = (id: string): Deel | undefined => DELEN.find((d) => d.id === id)
