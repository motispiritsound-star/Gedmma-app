/**
 * Het bronnenregister van Marokko 360°.
 *
 * Elke bewering in de encyclopedie wijst hierheen. Eén register en niet een
 * bronnenlijst per hoofdstuk, om twee redenen: dezelfde bron draagt vaak
 * tientallen beweringen in verschillende delen, en een bron die van `gevonden`
 * naar `gelezen` gaat hoort dat op één plek te doen.
 *
 * ## Waarom hier nog niets `gelezen` is
 *
 * Deze omgeving komt niet bij externe sites. Nagegaan op 3 oktober 2026:
 * `whc.unesco.org`, `en.wikipedia.org`, `journals.openedition.org`,
 * `www.jstor.org`, `www.persee.fr`, `archive.org` en `www.britishmuseum.org`
 * geven allemaal `EGRESS_BLOCKED` of een verbinding die niet tot stand komt.
 * Zoeken kan wel — dat loopt buiten deze machine om — en dat is precies genoeg
 * om een bron te *vinden* en niet genoeg om hem te *lezen*.
 *
 * Dat verschil is hier geen formaliteit. De opdracht zegt: gebruik zoekmachines
 * en naslagwerken hoogstens om mogelijke bronnen te vinden, en onderbouw er
 * niets mee. Dus staat alles hieronder op `gevonden`, en kan er volgens
 * `encyclopedie.test.ts` geen enkel hoofdstuk gepubliceerd worden. Dat is de
 * bedoeling: de rem zit in het model en niet in de goede wil van wie schrijft.
 *
 * Gaat de netwerktoegang open, dan is de volgorde: bron openen, bewering
 * ernaast leggen, `stand` op `gelezen`, `gelezenOp` en `plek` invullen. Pas
 * daarna mag het hoofdstuk op `gepubliceerd`.
 */

import type { Bron } from './types'

export const BRONNEN: Bron[] = [
  {
    id: 'unesco-836',
    soort: 'erfgoed',
    stand: 'gelezen',
    gelezenOp: '2026-10-05',
    gelezenDoor: 'redactie',
    plek: 'Outstanding Universal Value → Brief synthesis; Criteria (ii)(iii)(iv)(vi); '
      + 'en het gegevensblok onderaan: Date of Inscription 1997, dossier 836bis, '
      + 'Property 42 ha, Buffer zone 4.200 ha.',
    wie: 'UNESCO World Heritage Centre',
    titel: 'Archaeological Site of Volubilis',
    waar: 'World Heritage List, nr. 836',
    jaar: 1997,
    url: 'https://whc.unesco.org/en/list/836/',
    taal: 'en',
    noot: 'Het inschrijvingsdossier zegt wat er beschermd is en op welke criteria — '
      + 'niet wat historisch vaststaat. Bruikbaar voor de inschrijving zelf, de '
      + 'begrenzing van het terrein en de staat van het monument; niet als enige '
      + 'bron voor datering of bewoningsgeschiedenis.',
    // Gelezen op 5 oktober 2026 via het Internet Archive, omdat whc.unesco.org
    // zelf achter een Cloudflare-controle staat die een geautomatiseerde
    // browser niet doorlaat. Het adres hierboven blijft het adres van de bron;
    // het archief is hoe hij is ingezien, niet waar hij staat.
  },
  {
    id: 'unesco-836-evaluatie',
    soort: 'erfgoed',
    stand: 'gevonden',
    wie: 'ICOMOS, voor het World Heritage Committee',
    titel: 'Advisory Body Evaluation, nominatie 836bis (Volubilis)',
    url: 'https://webarchive.unesco.org/web/20151223231431/http://whc.unesco.org/archive/advisory_body_evaluation/836bis.pdf',
    taal: 'en',
    noot: 'De evaluatie achter de inschrijving; uitgebreider dan de lijstpagina en '
      + 'met verwijzingen naar het archeologisch onderzoek. Gearchiveerde pdf, dus '
      + 'de vindplaats is stabieler dan de oorspronkelijke URL.',
  },
  {
    id: 'fentress-limane-2019',
    soort: 'academisch',
    stand: 'gevonden',
    wie: 'Elizabeth Fentress & Hassan Limane (red.)',
    titel: 'Volubilis après Rome: Les fouilles UCL/INSAP, 2000–2005',
    waar: 'Brill, Leiden',
    taal: 'fr',
    noot: 'De opgravingen van University College London met het Institut National '
      + 'des Sciences de l’Archéologie et du Patrimoine. Gaat juist over de periode '
      + 'ná Rome, die in ouder onderzoek is overgeslagen. Dit is de bron die '
      + 'geopend moet worden voor alles over de laat-antieke en vroeg-islamitische '
      + 'bewoning; het jaartal van uitgave moet nog bevestigd worden.',
  },
  {
    id: 'ucl-insap-project',
    soort: 'erfgoed',
    stand: 'gelezen',
    gelezenOp: '2026-10-05',
    gelezenDoor: 'redactie',
    plek: 'www/english/index.htm en www/english/about/index.htm',
    wie: 'UCL Institute of Archaeology & INSAP',
    titel: 'Volubilis Archaeological Project',
    url: 'https://volubilis.lparchaeology.com/',
    taal: 'en',
    noot: 'De projectsite bij de opgraving hierboven, met veldwerkdocumentatie in '
      + 'het Engels en het Frans. Een projectsite is geen peer-reviewed publicatie; '
      + 'bruikbaar om te vinden wat waar gepubliceerd is.',
    // Gelezen op 5 oktober 2026, en dat veranderde wat deze bron kan dragen.
    //
    // De site is voor het laatst bijgewerkt op 25 september 2003 -- dat staat er
    // zelf onderaan elke bladzijde -- en dus vóór het einde van de opgraving van
    // 2000-2005. De navigatie bestaat uit plaatjes en er staat nauwelijks tekst:
    // de openingsbladzijde zegt dat Volubilis werelderfgoed is en noemt het
    // Anglo-Moroccan Volubilis Project, en de bladzijde 'About Volubilis' bevat
    // één regel die naar andere bladzijden verwijst.
    //
    // Daarmee draagt deze bron wél dat het project bestond en wie eraan werkte,
    // en níét de jaartallen 2000-2005, niet dat het onderzoek zich op de
    // bewoning ná Rome richtte, en al helemaal niet de chronologie die daaruit
    // volgt. Hij is daarom uit de bronnenlijst van blok 4 en van de tijdlijnpost
    // 'walili-ucl' gehaald: een bron die de bewering niet draagt hoort er niet
    // onder te staan, ook niet als tweede naam.
    //
    // Wat overblijft voor die twee is het boek van Fentress en Limane.
  },
  {
    id: 'wmf-volubilis',
    soort: 'erfgoed',
    stand: 'gevonden',
    wie: 'World Monuments Fund',
    titel: 'Volubilis Archaeological Site',
    url: 'https://www.wmf.org/node/14142',
    taal: 'en',
    noot: 'Een erfgoedorganisatie over de staat en bedreigingen van het terrein. '
      + 'Zegt iets over behoud, niet over geschiedenis.',
    // Nagemeten op 5 oktober 2026: dit adres leeft niet meer. `/node/14142`
    // geeft 404, en `/project/volubilis` stuurt door naar `/projects/volubilis`
    // dat ook 404 geeft. De pagina is van de site van WMF verdwenen.
    //
    // Blijft voorlopig staan en wordt niet stilletjes weggehaald: geen enkel
    // blok in het hoofdstuk over Walili verwijst ernaar, dus hij houdt niets
    // tegen, en een bron die ooit bestaan heeft hoort via een archief terug
    // te vinden te zijn in plaats van uit het register te verdwijnen.
  },
]

export const bronVan = (id: string): Bron | undefined => BRONNEN.find((b) => b.id === id)

/** Of deze bron een bewering mag dragen: alleen een bron die gelezen is. */
export const draagbaar = (b: Bron): boolean => b.stand === 'gelezen'
