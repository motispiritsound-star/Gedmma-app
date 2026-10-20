# Dilimiz — leerlijn

> **Status:** voorstel, en nog niet nagekeken door een moedertaalspreker.
> Elke Turkse string in dit document en in `src/content/` staat onder
> `nagekeken: false` totdat een moedertaalspreker of Turkse taaldocent hem
> heeft gezien. `src/content/nagekeken.test.ts` telt hoeveel dat zijn.

## De taal die we onderwijzen

Modern, natuurlijk Turks zoals het in Turkije gesproken wordt — İstanbul-Turks
als standaard, omdat dat is wat op televisie, in boeken en op school gebruikt
wordt en wat familie in Turkije verwacht.

**Wel in de app:**
- Het Turkse Latijnse alfabet, 29 letters.
- Alledaagse spreektaal: `görüşürüz`, `sağ ol`, `ne haber`.
- De woorden die een kind tegen familie zegt.

**Niet in de app:**
- Arabisch schrift. Turks is sinds 1928 in Latijns schrift geschreven; een
  cursus die daarvan uitgaat leert een kind iets wat het nooit gebruikt.
- Osmaans-Turks.
- Regionale dialectvormen als lesnorm. Ze worden wél genoemd waar het
  uitmaakt: een kind uit een familie uit Kayseri of Trabzon hoort thuis iets
  anders dan de les zegt, en dat is geen fout van het kind of van de les. Zie
  §Verschillen benoemen.

## Wat Turks moeilijk maakt — en wat dus het ontwerp bepaalt

Dit is het deel waar een vertaalde cursus faalt. Darija en Turks zijn allebei
"een andere taal", maar ze zijn op andere plekken moeilijk.

### 1. Zes letters die een Nederlandse of Duitse lezer verkeerd leest

| Letter | Klinkt als | Wat een NL/DE-lezer er fout van maakt |
|---|---|---|
| `c` | *dzj*, als de j in het Engelse *jam* | Leest het als k of s. `cam` wordt "kam" |
| `ç` | *tsj*, als tsj in *tsjilpen* | Leest het als c |
| `ğ` | zachte g: rekt de klinker ervoor, soms bijna stil | Leest het als een harde g. `dağ` wordt "dag" |
| `ı` | ongeronde klinker achterin de mond, géén i | Leest het als i. `kıl` wordt `kil` |
| `ö` `ü` | als in *deur* en *duur* | NL/DE gaat goed, FR/EN struikelt |
| `ş` | *sj* | Leest het als s |

Daarbij: `h` wordt altijd uitgesproken (een Franse lezer laat hem weg), `r`
wordt altijd gerold of getikt, `y` is een *j*, en `e` is altijd kort.

**Hoe we dat oefenen:** niet met een letterlijst, maar met **klankparen** —
twee echte woorden die alleen in die ene letter verschillen. Het kind hoort ze
en wijst aan welke het was. Dat is de oefenvorm die het verschil hoorbaar
maakt in plaats van het uit te leggen.

| Paar | Betekenis | Oefent |
|---|---|---|
| `cam` / `çam` | glas / pijnboom | c vs ç |
| `kıl` / `kil` | haartje / klei | ı vs i |
| `kır` / `kir` | platteland / vuil | ı vs i |
| `koy` / `köy` | baai / dorp | o vs ö |
| `tur` / `tür` | rondje / soort | u vs ü |
| `un` / `ün` | meel / roem | u vs ü |
| `kas` / `kaş` | spier / wenkbrauw | s vs ş |
| `dağ` / `da` | berg / ook | ğ hoorbaar maken |

### 2. Klinkerharmonie

De klinker van een achtervoegsel volgt de klinker van het woord. Twee regels,
en ze zijn allebei zonder uitzondering genoeg om te onderwijzen:

**Tweevoudig (a/e).** Achter `a ı o u` komt **a**; achter `e i ö ü` komt **e**.
> `ev` → `ev**ler**` · `okul` → `okul**lar**`

**Viervoudig (ı/i/u/ü).** Achter `a ı` komt **ı**; achter `e i` komt **i**;
achter `o u` komt **u**; achter `ö ü` komt **ü**.
> `kitap` → `kitab**ım**` · `ev` → `ev**im**` · `okul` → `okul**um**` ·
> `göz` → `göz**üm**`

En één hulpregel die kinderen snel pakken: na een **stemloze** consonant
(`f s t k ç ş h p` — Turkse kinderen leren dat als het zinnetje
*fıstıkçı şahap*) wordt `-de` een `-te`.
> `ev` → `ev**de**` · `kitap` → `kitap**ta**`

**Hoe we dat oefenen:** een eigen oefenvorm (`harmonie`). Het woord staat er,
het achtervoegsel moet gekozen worden uit twee of vier knoppen. Geen uitleg
eerst — na vier keer goed komt de regel als tip, en dan klikt het.

### 3. Agglutinatie

Een Turks woord plakt achtervoegsels aan elkaar waar het Nederlands losse
woorden gebruikt:

> `ev` · `ev-ler` · `ev-ler-imiz` · `ev-ler-imiz-de`
> huis · huizen · onze huizen · in onze huizen

Voor een Nederlandstalig kind is dat eerst onleesbaar en daarna het leukste
deel van de taal — het is te bouwen als lego.

**Hoe we dat oefenen:** de oefenvorm `plak`. De stam staat links, de
achtervoegsels liggen als tegels klaar, het kind legt ze in de goede volgorde
en ziet het woord groeien. Dit is de oefenvorm die in de plaats komt van het
natekenen van Arabische letters in de eerste app, en die net als dat iets doet
wat een papieren boek niet kan.

### 4. Wat juist makkelijk is, en dat mag gezegd worden

- **Spelling is fonetisch.** Wat je ziet, zeg je. Eén keer het alfabet door en
  je kunt elk woord voorlezen. Dat is een enorm cadeau en het hoort in les één
  gezegd te worden, want het maakt de eerste week licht.
- **Geen grammaticaal geslacht**, geen `de/het`, geen `der/die/das`.
- **Geen onregelmatige werkwoorden** in de zin waarin het Nederlands die heeft.

### 5. De woordvolgorde is onderwerp–voorwerp–werkwoord

`Ben elma yiyorum` — "ik appel eet". Dat is een omschakeling, en de
bouwoefening (`zin-bouw`) is er precies goed voor: het kind legt de tegels in
een andere volgorde dan het gewend is en ziet dat het klopt.

## De opbouw

Elf units, van niets naar eenvoudige gesprekken. Units 0–3 zijn de MVP.

| # | Unit | Turks | Wat het kind daarna kan | Niveau |
|---|---|---|---|---|
| 0 | Letters en klanken | `Harfler` | Elk Turks woord voorlezen; de zes lastige letters horen | A0 |
| 1 | Groeten | `Merhaba` | Hallo, dag, dank je, hoe gaat het | A0 |
| 2 | Ik en jij | `Ben ve Sen` | Zichzelf voorstellen, naam en leeftijd zeggen | A0 |
| 3 | Familie | `Aile` | Familieleden benoemen en aanwijzen | A1 |
| 4 | Thuis | `Ev` | Zeggen waar iets is, en waar het zelf woont | A1 |
| 5 | Eten | `Yemek` | Aan tafel meedoen; zeggen wat het lekker vindt | A1 |
| 6 | School | `Okul` | Over de dag op school vertellen | A1 |
| 7 | Gevoelens | `Nasılsın?` | Zeggen hoe het zich voelt en vragen hoe het met jou is | A1 |
| 8 | De dag | `Günüm` | Dagelijkse routine, tijd, dagen van de week | A1 |
| 9 | Op reis | `Yolculuk` | Vliegveld, dorp, familiebezoek, markt | A2 |
| 10 | Gesprek | `Konuşma` | Een gesprekje met oma volhouden | A2 |

**Unit 0 staat vooraan, net als het alfabet bij de eerste app** — maar om een
andere reden. Daar moest een kind een nieuw schrift leren voor het één woord
kon lezen. Hier kán het de letters al lezen; wat het moet leren is ze *anders*
lezen. Dat is korter: zes letters en drie klankparen in plaats van 28 letters
in vier vormen.

### Les 1 van unit 1, als voorbeeld

Woorden: `merhaba`, `selam`, `günaydın`, `teşekkür ederim`, `evet`, `hayır`.

Zinnen aan het eind: `Merhaba! Benim adım Deniz.` · `Günaydın anne!`

Oefenvormen in volgorde: `nieuw` (leerkaart met audio) → `kies-betekenis` →
`luister` → `kies-turks` → `tik` → `zin-bouw` → `spreek`.

Zes woorden, ongeveer achttien oefeningen, vijf tot zeven minuten.

### Waarom groeten en familie eerst

Omdat dat de woorden zijn die een kind dezelfde avond kan gebruiken. `Günaydın
anne` werkt aan het ontbijt, `Bu benim ablam` werkt bij een videogesprek met
Turkije. Kleuren en cijfers zijn makkelijker te onderwijzen maar nergens voor
nodig; die komen later als vulling.

## Leeftijdsgroepen (voorstel)

Drie vormen van dezelfde inhoud. **De leeftijd is een voorstel bij de start,
geen vastgelegd gegeven, en wordt niet opgeslagen als geboortedatum** — alleen
als keuze `klein` / `midden` / `groot`, op het toestel. Zie
`privacy-and-safety.md`.

| | 4–6 `klein` | 7–11 `midden` | 12+ `groot` |
|---|---|---|---|
| Lesduur | 3 min | 6 min | 10 min |
| Lezen | Beeld + audio, tekst klein | Tekst + audio | Tekst leidt |
| Oefenvormen | aanwijzen, luisteren, naspreken | alles | alles, plus `plak` en `harmonie` |
| Typen | nee | ja, met hulptoetsen | ja |
| Toon | mascotte spreekt | mascotte op de achtergrond | geen mascotte |
| Grammatica | nooit benoemd | als tip ná het oefenen | expliciet, als patroon |

Een jongere van vijftien die een kinderapp krijgt, stopt. Daarom verdwijnt in
`groot` de mascotte en wordt de taal zakelijker — dezelfde inhoud, ander jasje.

## Audio

**Moedertaalsprekers, en dat is niet optioneel.** Een kind dat `ğ` van een
synthesestem leert, leert hem verkeerd, en een ouder die het hoort gelooft de
app niet meer.

Opzet:
- Eén opname per woord en per zin, `wav` → `mp3`/`opus` bij de bouw,
  gebundeld in de app zodat hij offline werkt.
- **Twee stemmen** per unit waar het kan: een vrouwenstem en een
  kinderstem. Een kind spreekt een kinderstem beter na.
- De bestandsnaam is de id van het woord. Zie `architecture.md`.
- **Terugval tot de opnames er zijn:** de spraaksynthese van het toestel in
  `tr-TR`, zichtbaar gemarkeerd in de app als "computerstem" en in het
  ouderoverzicht benoemd. Geen lancering met synthese voor units 0–3.

Wat de eigenaar moet regelen: twee sprekers, een opnamelijst (het script
genereert die uit de inhoud), en een stille kamer.

## Cultuur en geschiedenis — en de regels die daarbij horen

De MVP bevat **geen** geschiedenisreeks. Cultuur zit erin als context bij
taal: wat je zegt als je iemand thuis bezoekt, waarom je `teyze` en `hala`
niet door elkaar gebruikt, dat je schoenen uitdoet bij de deur.

Vier regels, en ze zijn er omdat dit het deel is waar een fout het meest kost:

1. **Geen verzonnen feiten.** Elk cultureel of historisch gegeven staat in
   `src/content/bronnen.ts` met een herkomst. Geen bron, dan niet in de app.
   `src/content/bronnen.test.ts` controleert dat elk cultuurfeit een bron
   heeft.
2. **Verschillen benoemen.** Niet "Turken doen X". Wel "bij veel gezinnen",
   "in sommige streken", "mijn oma zegt het anders". Het kind in de app komt
   uit een gezin dat mogelijk Koerdisch, Zaza, Arabisch, Laz of Circassisch is
   of een mengeling; uit een dorp of uit İstanbul; religieus of niet; en de app
   mag niet suggereren dat er één juiste manier is.
3. **Geen politiek, geen staatsymboliek, geen nationale helden.** Zie
   `brand-brief.md` §Waarom geen vlag.
4. **Op de leeftijd afgestemd.** Een onderwerp dat voor een kind van zeven niet
   uit te leggen is zonder het te versimpelen tot onwaarheid, hoort niet in de
   groep `klein`.

Een geschiedenisreeks kan later, als eigen project, met redactie en
bronnenverantwoording. Niet als bijlage bij een taalapp.

## Wat gescheiden blijft

| | Waar | Taal |
|---|---|---|
| Interfaceteksten | `src/i18n/` | nl, de, fr, en (uitbreidbaar) |
| Turkse cursusinhoud | `src/content/` | Turks + betekenis per interfacetaal |

Twee gescheiden stapels, en met opzet. De Turkse woorden veranderen niet als
er een interfacetaal bijkomt, en een vertaler die de interface doet hoeft geen
Turks te kennen. `src/i18n/i18n.test.ts` controleert dat elke taal dezelfde
sleutels heeft; `src/content/content.test.ts` dat elk woord een betekenis in
elke taal heeft.

## Nog te beslissen

- Wordt `groot` (12+) in de MVP gebouwd of alleen voorbereid? Nu: voorbereid in
  de data, één lesvorm in de app. Zie `decisions.md` B-4.
- Komen er Koerdische, Zaza- of Arabische interfacetalen? Niet in de MVP; wel
  een vraag die eerlijk gesteld hoort te worden, want het is dezelfde diaspora.
- Hoeveel woorden per unit? Nu 6–10 per les, 30–45 per unit. Dat is te meten
  zodra er gebruikers zijn.
