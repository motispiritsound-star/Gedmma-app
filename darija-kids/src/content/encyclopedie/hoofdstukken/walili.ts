/**
 * Proefhoofdstuk: Walili / Volubilis.
 *
 * Gekozen omdat het drie dingen tegelijk toetst. Het staat al als kaart in de
 * app (`history.ts`, kaart `walili`), dus het laat zien hoe de encyclopedie
 * zich verhoudt tot wat er al is. Het heeft een erfgoeddossier én recent
 * archeologisch onderzoek, dus de bronnenhiërarchie doet echt werk. En het is
 * het schoolvoorbeeld van een plek waar de oude literatuur en het nieuwe
 * onderzoek elkaar tegenspreken — precies waar "wat weten we zeker" over gaat.
 *
 * **Dit hoofdstuk staat op `concept` en hoort dat voorlopig te blijven.** Geen
 * van de bronnen is geopend; zie `bronnen.ts` voor waarom dat in deze omgeving
 * niet kon. Wat hieronder staat is opgeschreven uit zoekresultaten die naar
 * deze bronnen verwijzen, en dat is nadrukkelijk niet hetzelfde als nalezen.
 * Elk blok wijst al wel naar de bron die het moet dragen, zodat het nalezen
 * een afvinkbare handeling wordt in plaats van een zoektocht.
 */

import type { Hoofdstuk } from '../types'

export const WALILI: Hoofdstuk = {
  id: 'walili',
  deel: 'm2',
  titel: 'Walili: de stad die bleef toen Rome wegging',
  kort: 'Een stad in de heuvels bij Meknes die Romeins was, Romeins ophield te '
    + 'zijn, en daarna nog eeuwen doorging.',
  stand: 'concept',
  plaatsTijd: 'Noord-Marokko, bij het huidige Meknes — van de derde eeuw v.Chr. '
    + 'tot ver in de middeleeuwen',

  blokken: [
    {
      soort: 'verhaal',
      tekst: 'Wie bij Meknes de heuvels in rijdt, komt langs een vlakte met '
        + 'olijfbomen en daarin een stad zonder daken. Zuilen, drempels, de '
        + 'contouren van straten. Het is de bekendste Romeinse vindplaats van '
        + 'Marokko, en dat is tegelijk de reden dat er lang iets over het hoofd '
        + 'is gezien.',
    },
    {
      soort: 'kop',
      tekst: 'Een stad met twee namen',
    },
    {
      soort: 'feit',
      tekst: 'De plaats heet in het Arabisch Walili en in Latijnse bronnen '
        + 'Volubilis. Op de Werelderfgoedlijst staat zij als Archaeological Site '
        + 'of Volubilis.',
      bronnen: ['unesco-836'],
      zekerheid: 'vast',
    },
    {
      soort: 'feit',
      tekst: 'UNESCO plaatste het terrein in 1997 op de Werelderfgoedlijst, onder '
        + 'de criteria ii, iii, iv en vi.',
      bronnen: ['unesco-836', 'unesco-836-evaluatie'],
      zekerheid: 'waarschijnlijk',
    },
    {
      soort: 'kop',
      tekst: 'Voor Rome, en met Rome',
    },
    {
      soort: 'feit',
      tekst: 'De stad bestond al voordat zij Romeins werd: zij was een plaats in '
        + 'het koninkrijk Mauretanië en werd later een stad in de Romeinse '
        + 'provincie Mauretania Tingitana.',
      bronnen: ['unesco-836', 'unesco-836-evaluatie'],
      zekerheid: 'waarschijnlijk',
      discussie: 'De stichtingsdatum die in overzichtswerken rondgaat — derde eeuw '
        + 'v.Chr. — moet tegen het opgravingsverslag gelegd worden voordat hij '
        + 'hier als jaartal komt te staan.',
    },
    {
      soort: 'kop',
      tekst: 'Wat er daarna gebeurde, en waarom dat lang onbekend bleef',
    },
    {
      soort: 'verhaal',
      tekst: 'De opgravers van de twintigste eeuw gingen op zoek naar het Romeinse '
        + 'Volubilis. Wat daar bovenop lag, was daarmee vooral in de weg.',
    },
    {
      soort: 'feit',
      tekst: 'De opgravingen van University College London en het Institut '
        + 'National des Sciences de l’Archéologie et du Patrimoine, tussen 2000 en '
        + '2005, richtten zich juist op de bewoning ná de Romeinse periode.',
      bronnen: ['fentress-limane-2019', 'ucl-insap-project'],
      zekerheid: 'waarschijnlijk',
    },
    {
      soort: 'feit',
      tekst: 'Uit dat onderzoek komt het beeld dat de stad in de vroege vijfde '
        + 'eeuw werd verlaten, in de zesde eeuw opnieuw bewoond raakte, en tot in '
        + 'de negende eeuw bleef bestaan.',
      bronnen: ['fentress-limane-2019'],
      zekerheid: 'betwist',
      discussie: 'Dit is de kern van het nieuwere onderzoek en het wijkt af van '
        + 'oudere overzichten, waarin de stad met Rome verdwijnt. Welke datering '
        + 'waarop steunt, en hoe hard "verlaten" is, moet uit het verslag zelf '
        + 'komen.',
    },
  ],

  tijdlijn: [
    {
      id: 'walili-unesco',
      wat: 'Het terrein komt op de Werelderfgoedlijst',
      jaar: 1997,
      wanneer: '1997',
      zekerheid: 'waarschijnlijk',
      bronnen: ['unesco-836'],
      plaats: 'walili',
    },
    {
      id: 'walili-ucl',
      wat: 'Opgravingen van UCL en INSAP naar de bewoning ná Rome',
      jaar: 2000,
      wanneer: '2000 – 2005',
      zekerheid: 'waarschijnlijk',
      bronnen: ['fentress-limane-2019', 'ucl-insap-project'],
      plaats: 'walili',
    },
  ],

  plaatsen: ['walili'],
  personen: [],

  zekerEnOnzeker: [
    'Dat de plaats bestaat, waar zij ligt en dat zij beschermd werelderfgoed is, '
      + 'staat vast en is in een erfgoeddossier na te zoeken.',
    'De datering van de stichting is in deze opzet nog niet vastgesteld. Het '
      + 'getal dat in overzichtswerken rondgaat, hoort pas op deze bladzijde als '
      + 'het uit archeologisch onderzoek komt.',
    'Wat er ná de Romeinse periode gebeurde, is het onderwerp waarop het nieuwere '
      + 'onderzoek afwijkt van oudere literatuur. Deze bladzijde volgt dat '
      + 'onderzoek zodra het nagelezen is, en zegt erbij waar het van afwijkt.',
    'Niets op deze bladzijde is op dit moment tegen de bron zelf gelegd. Daarom '
      + 'staat het hoofdstuk op concept.',
  ],

  verder: [],
  talen: ['nl'],
}

/** De plaats bij dit hoofdstuk. Eén plaats, want het hele hoofdstuk gaat erover. */
export const WALILI_PLAATS = {
  id: 'walili',
  naam: 'Walili',
  ook: ['Volubilis', 'وليلي', 'Walīlā'],
  coord: undefined,
  bronnen: ['unesco-836'],
}
