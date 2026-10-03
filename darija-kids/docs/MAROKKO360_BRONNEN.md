# Marokko 360° — bronnenregister

Het register zelf staat in `src/content/encyclopedie/bronnen.ts`. Dit document
zegt hoe het gebruikt wordt, en waarom het op dit moment leeg is op de enige
manier die ertoe doet.

## De blokkade

**In deze omgeving is geen enkele externe bron te openen.** Nagegaan op
3 oktober 2026, allemaal geweigerd door het netwerkbeleid van de omgeving:

| Host | Uitkomst |
|---|---|
| `whc.unesco.org` | `EGRESS_BLOCKED` |
| `en.wikipedia.org` | `EGRESS_BLOCKED` |
| `journals.openedition.org` | `EGRESS_BLOCKED` |
| `www.jstor.org` | geen verbinding |
| `www.persee.fr` | geen verbinding |
| `archive.org` | geen verbinding |
| `www.britishmuseum.org` | geen verbinding |

Zoeken werkt wél, want dat loopt buiten deze machine om. Daarmee is een bron te
**vinden** — titel, auteur, uitgever, URL — en niet te **lezen**.

Dat onderscheid is precies waar deze opdracht op staat. De opdracht zegt:
gebruik zoekmachines en naslagwerken hoogstens om mogelijke bronnen te vinden,
en onderbouw er niets mee. Dus staat alles in het register op `gevonden`, en kan
er volgens de regel geen enkel hoofdstuk gepubliceerd worden.

**Wat dit oplost:** het netwerkbeleid van de omgeving verruimen, of de genoemde
hosts toevoegen onder *Allowed domains* bij *Network access* in de instellingen
van de omgeving. De stappen staan op
`https://code.claude.com/docs/en/cloud-environments#network-access`.

## De drie standen

- **`gevonden`** — we weten dat de bron bestaat en waar. Niemand heeft hem
  geopend. Draagt niets.
- **`gelezen`** — iemand heeft de bron geopend en de bewering ernaast gelegd.
  `gelezenOp` (YYYY-MM-DD) en `plek` (bladzijde of sectie) zijn dan verplicht.
- **`betwist`** — gelezen, en in tegenspraak met andere bronnen of zelf
  omstreden. Blijft staan: dit is de grondstof voor "wat weten we zeker".

## De handeling

Voor elke bron, in deze volgorde:

1. Open de bron.
2. Zoek de passage die de bewering draagt. Niet het onderwerp — de bewering.
3. Vul `plek` in: bladzijde, sectie, dossiernummer.
4. Zet `stand` op `gelezen`, vul `gelezenOp` en `gelezenDoor`.
5. Spreekt de bron de bewering niet aan, of anders, dan verandert de bewering —
   niet de stand.

Pas als elk feitelijk blok van een hoofdstuk minstens één gelezen bron heeft,
mag `stand` van dat hoofdstuk op `gepubliceerd`. `encyclopedie.test.ts` rekent
dat na bij elke testronde.

## Wat er nu in staat

Vijf bronnen, alle vijf `gevonden`, alle vijf voor het proefhoofdstuk over
Walili / Volubilis:

| id | soort | wie | wat |
|---|---|---|---|
| `unesco-836` | erfgoed | UNESCO World Heritage Centre | Werelderfgoedlijst nr. 836 |
| `unesco-836-evaluatie` | erfgoed | ICOMOS | evaluatie bij nominatie 836bis |
| `fentress-limane-2019` | academisch | Fentress & Limane (red.) | *Volubilis après Rome*, opgravingen UCL/INSAP 2000–2005 |
| `ucl-insap-project` | erfgoed | UCL Institute of Archaeology & INSAP | projectdocumentatie |
| `wmf-volubilis` | erfgoed | World Monuments Fund | staat en behoud van het terrein |

Bij elke bron staat in `noot` wat zijn beperking is. Dat veld is verplicht en
wordt op lengte gecontroleerd, want een bron zonder beperking bestaat niet: een
erfgoeddossier zegt wat beschermd is en niet wat historisch vaststaat.

## Open vragen bij dit register

- Het uitgavejaar van *Volubilis après Rome* staat nog niet vast en is in het
  register bewust leeggelaten.
- Er zit nog geen enkele Arabische of Amazigh bron in. Dat is een gat dat bij
  het eerste echte onderzoek gedicht moet worden, niet later.
- Er is nog geen beeld in de reeks, en dus ook nog geen licentieregister. Zodra
  er één afbeelding bij komt, hoort daar bron, maker en licentie bij.
