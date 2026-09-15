# 19 — De Koranvertaling: drie uitwegen uit één blokkade

Status: advies. Nog geen besluit.
Datum: 2026-09-15.

`npm run release` houdt video 1 tegen op dit punt, en terecht. Het script vraagt
in segment 2 om een **woordelijk citaat** van soera 2, ayah 144, met de
uitdrukkelijke aantekening *NIET PARAFRASEREN*. Dat is een bewuste keuze: de
Koran parafraseren en het laten klinken als de tekst zelf is precies wat een
reviewer zou moeten tegenhouden.

Maar daarmee heb je een auteursrechtprobleem. De Arabische tekst is
eeuwenoud en vrij. **Een vertaling is een zelfstandig werk met een eigen
auteursrecht**, en dat vervalt in Nederland pas zeventig jaar na de dood van de
vertaler (Auteurswet art. 37). "Het is de Koran" dekt de vertaling niet.

## Wat ik niet heb kunnen verifiëren

De egressregels van deze omgeving blokkeren `tanzil.net` en de
Utrecht-bibliografie, dus ik kon de licentievoorwaarden niet bij de bron lezen.
Wat hieronder staat over licenties is **bron C**: in zoekresultaten gevonden,
niet bij de rechthebbende bevestigd.

Eén ding wil ik met nadruk als val aanwijzen. In zoekresultaten circuleert dat
de vertaling van **Fred Leemhuis onder CC BY** zou vallen omdat hij via Tanzil
in open corpora is opgenomen. Leun daar niet op. Leemhuis leeft en zijn
vertaling is een uitgegeven, commercieel verkocht werk; dat een derde partij
hem in een dataset heeft gezet, is geen toestemming van de rechthebbende. Dit
is letterlijk het geval waar `circulated` in de bronnenlogica voor bestaat:
"het staat overal" is geen bewijs.

## Drie uitwegen

### A. Een vertaling die aantoonbaar vrij is

**Salomon Keyzer** (1823–1868), *De Koran*, Haarlem 1860. De vertaler is in 1868
overleden, dus het auteursrecht is ruim vóór 1938 vervallen. Dit is de enige
optie waarbij je niets hoeft te vragen en niets kunt verliezen.

Prijs: het is Nederlands uit 1860. Dat leest als een preek uit de negentiende
eeuw en botst met een script dat verder in gewone spreektaal staat.

Let op bij **Kramers** (1956), die vaak als "oud genoeg" wordt genoemd: J.H.
Kramers stierf in 1951, dus zijn tekst is sinds 1 januari 2022 vrij — maar de
uitgave van 1956 is persklaar gemaakt door **R.W. van Diffelen** († 1992). Die
redactielaag kan tot 2063 beschermd zijn. De gedrukte editie van 1956 is dus
niet zonder meer vrij, ook al is Kramers' eigen vertaling dat wel. Wil je deze
route, dan is dat een vraag voor een jurist, niet voor mij.

### B. Toestemming vragen voor een moderne vertaling

Leemhuis of Siregar leest veel beter, en een uitgever kan toestemming geven voor
gebruik in video's. Reken op dagen tot weken, en mogelijk op een vergoeding of
een weigering, want dit is commercieel gebruik.

Het kost je niets om het te vragen, maar het is geen route waarop je video 1
kunt laten wachten.

### B2. As-Soennah — de vertaling die je zelf aandroeg

*De interpretatie van de betekenissen van de Koran*, van Aboe Ismail en
studenten, uitgegeven door **Stichting as-Soennah**, eerste druk 2015
(ISBN 9789081939966, pocket 9789492132031).

Inhoudelijk is dit een betere keuze dan Keyzer voor wat jij maakt: hedendaags
Nederlands, gericht op begrijpelijkheid, en het past bij de toon van je kanaal.

Maar het verandert niets aan de vergunningsvraag, en dat is het punt waar ik
niet omheen kan. De vertalers leven, de uitgave wordt gewoon in de boekhandel
verkocht, en dat de tekst gratis op aboeismail.nl te lezen staat is **geen
licentie**. Vrij te lezen en vrij te gebruiken zijn twee verschillende dingen.
Voor een gemonetiseerd YouTube-kanaal heb je toestemming nodig.

Het goede nieuws: as-Soennah is een Nederlandse stichting die je gewoon kunt
mailen, en een Nederlandstalig gezinskanaal dat netjes bronvermeldt is precies
het soort gebruik waar zo'n stichting doorgaans niet moeilijk over doet. Vragen
kost een e-mail. Wachten op het antwoord kost je alleen tijd als je video 1
ervan af laat hangen — en dat hoeft niet, zie C.

De website zelf kon ik niet openen (geblokkeerd vanuit deze omgeving), dus of er
al gebruiksvoorwaarden op staan heb ik niet kunnen zien. Kijk daar zelf even:
staat er een regel over overname, dan heb je je antwoord mogelijk al.

### C. Het script zo maken dat er geen citaat nodig is

De video gaat over een gebouw, niet over tafsir. De zin die er staat is:

> "In de Koran, in soera Al-Baqara, wordt die verandering beschreven."

Daarna volgt het citaat. Maar de video heeft dat citaat niet nodig om te
werken: de gebeurtenis — de gebedsrichting veranderde van Jeruzalem naar Mekka —
is een historisch feit dat je gewoon kunt vertellen, met de vindplaats erbij
voor wie het wil nalezen.

Dat is geen parafrase van de Koran. Het is een gebeurtenis benoemen en zeggen
waar het staat. De verwijzing blijft, de tekst wordt niet nagesproken, en punt 2
van de bronnencheck verschuift van "welke vertaling mag ik gebruiken" naar
"klopt het vers dat ik noem" — een vraag die je reviewer in één minuut
beantwoordt.

## Wat ik zou doen

**C voor video 1, B2 ernaast in gang zetten.**

C haalt vandaag een blokkade weg zonder iets in te leveren wat de video nodig
heeft. B2 geeft je voor latere video's, waar een citaat wél het hart van de
aflevering is, een vertaling die leest zoals de rest van je kanaal klinkt. A
houd ik achter de hand: bruikbaar, maar de taal past niet bij wat je maakt.

Wat je ook kiest: leg het vast in `config/defaults.yaml` bij
`quran_translation`, met de vindplaats van de toestemming erbij. Bij C is dat
`geen — script citeert niet`.

## Bronnen

- Nederlandse vertalingen van de Koran, bibliografisch overzicht, Universiteit Utrecht — https://webspace.science.uu.nl/~gent0113/islam/koran_vertalingen_2.htm (B, pagina zelf geblokkeerd)
- Tanzil, licentievoorwaarden — https://tanzil.net/docs/license (C, niet te bereiken)
- Auteurswet art. 37 (zeventig jaar na overlijden) — algemeen bekend Nederlands recht (A)
