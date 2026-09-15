# 23 — Publiek beeld gebruiken, en waar dat misgaat

Status: register gebouwd, poort aangescherpt.
Datum: 2026-09-15.

## De aanname die niet klopt

> "publieks toegankelijke foto's en video beelden van de overheid bijvoorbeeld
> alles zonder auteursrechten"

Er zitten twee dingen in die uit elkaar moeten.

**"Van de overheid" betekent niet "zonder auteursrecht."** De Auteurswet
(art. 15b) zegt dat werken die door of namens de overheid openbaar zijn gemaakt
en waarvan de overheid rechthebbende is, vrij mogen worden hergebruikt —
**tenzij het auteursrecht uitdrukkelijk is voorbehouden**, bij wet, besluit of
met een mededeling op het werk zelf. Dat voorbehoud wordt gemaakt.

**En dit kanaal is commercieel.** Dat is een tweede zeef, en een strengere. Een
bron die "gratis voor educatief gebruik" zegt, is voor ons dicht.

## Waar dat op valt

**Rijkswaterstaat Beeldarchief.** De voorwaarden geven het beeld vrij voor
educatieve doeleinden en sluiten commercieel gebruik uit, met verplichte
naamsvermelding. Uitgerekend de dienst die over jouw onderwerp gaat.

Wat wél mag: hun **cijfers** gebruiken. Een getal uit een rapport overnemen met
bronvermelding is iets heel anders dan hun foto in je video zetten. Voor NL-001
is dat precies wat we doen.

## Wat wel mag

### Rijksmuseum — Rijksstudio (de sterkste)

CC0, publiek domein, commercieel toegestaan, geen naamsvermelding verplicht.

En dit is geen uitwijkmogelijkheid maar een betere bron dan waar je om vroeg.
Nederlandse landschapschilderijen, oude polderkaarten, prenten van watermolens,
gravures van dijkdoorbraken. Dat is precies het materiaal waar de beeldtaal van
NL-001 al op is gebaseerd — de lage horizon en de grote lucht komen daar
vandaan. Geleend beeld uit deze bron botst dus niet met de eigen tekeningen
maar hoort erbij.

Let op: alleen werken die zelf niet meer onder auteursrecht vallen.

### Nationaal Archief — fotocollectie

CC0 persfoto's uit de twintigste eeuw: de watersnood, de aanleg van werken.

**Voorwaarde die je niet mag overslaan:** staat er geen downloadknop en geen
CC0- of publiek-domeinvermelding bij, dan mag de foto niet hergebruikt worden.
Vermelding is niet verplicht; wij doen het toch, want het kost niets en het
maakt de video controleerbaar.

### Open Beelden — Beeld en Geluid (met een voorbehoud)

Polygoon-journaals over de Zuiderzeewerken, de watersnood, de bouw van
gemalen. Het enige echte bewegende archiefbeeld dat je gratis krijgt.

Maar veel ervan staat onder **CC BY-SA**. Die licentie staat commercieel
gebruik toe, mits naamsvermelding én **gelijk delen**: afgeleide werken onder
dezelfde voorwaarden. Wat dat betekent voor een video waarin zo'n fragment zit,
is een vraag voor een jurist en niet voor mij.

Tot die vraag beantwoord is: hier alleen items gebruiken die als CC0 of publiek
domein staan aangemerkt.

## Het gat dat dit blootlegde

De poort controleerde of elke asset een licentiebewijs had. Niet of dat bewijs
**commercieel gebruik toestaat**.

Een foto uit het Rijkswaterstaat-archief had dus keurig een bewijs — "vrij voor
educatief gebruik" — en kwam er zo doorheen. Precies de bron die een
gemonetiseerd kanaal niet mag gebruiken, en precies het onderwerp waar de
verleiding het grootst is.

`checkLicenseProofs` controleert nu drie dingen:

1. elke asset heeft een bewijs-id;
2. dat id verwijst naar een bewijs dat werkelijk bestaat — een verwijzing is
   geen bewijs;
3. dat bewijs staat commercieel gebruik toe, en zo niet, dan noemt de poort de
   rechthebbende bij naam.

Geeft een aanroeper de bewijzen niet mee, dan zegt de poort erbij dat hij dit
niet heeft kunnen controleren, in plaats van stilzwijgend groen licht te geven.

## De regel die boven alles staat

Archiefbeeld met een voice-over eroverheen is het schoolvoorbeeld in YouTube's
beleid voor hergebruikte content (`docs/03` §2, `docs/14`). Vrij materiaal is
dus geen vrijbrief maar een ingrediënt.

In `knowledge/beeldbronnen.yaml` staat daarom `max_geleend_aandeel: 0.25`. De
eigen tekeningen, de eigen analyse en de eigen verhaallijn blijven de hoofdmoot;
geleend beeld is de uitzondering die iets laat zien wat je niet kunt tekenen —
een foto van de watersnood, een gravure van een molen.

## Verificatiestatus

Alles hierboven komt uit zoekresultaten. De voorwaardenpagina's zelf waren
vanuit deze omgeving niet te openen. **Lees de voorwaarden van een bron één
keer zelf voordat je er beeld uit gebruikt**, en zet de status in
`knowledge/beeldbronnen.yaml` dan op A.

Dat is geen formaliteit: de belangrijkste bevinding in dit document — dat
Rijkswaterstaat commercieel gebruik uitsluit — is precies het soort ding dat
je pas ziet als je de pagina echt leest.

## Bronnen

- Auteurswet art. 15b — https://maxius.nl/auteurswet/artikel15b (B)
- Rijkswaterstaat, ons beeldarchief — https://www.rijkswaterstaat.nl/over-ons/onze-organisatie/ons-beeldarchief (B)
- Nationaal Archief, foto's als open data — https://www.nationaalarchief.nl/onderzoeken/open-data/fotos (B)
- Open Beelden — https://openbeelden.nl (B)
- Rijksmuseum data- en informatiebeleid — https://data.rijksmuseum.nl/policy/informatie-en-databeleid (B)
