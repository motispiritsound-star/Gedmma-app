# Alles wat je in CapCut kunt gebruiken

Een lijst van wat er klaarstaat, waar het staat, en met welk commando het
terugkomt als het er niet is. Geen enkel bestand hieronder is gegenereerd
beeld: het is de app zelf, de boeken zelf en de opnames zelf.

**Eén ding vooraf.** `brand/`, `store/video/`, `store/screenshots/` en
`store/marketing/` staan in `.gitignore`. Ze horen niet in de repository en ze
komen met één opdracht terug. Staat een map er niet, kijk dan in de kolom
*terug met* en draai die regel.

## Film — begin hier

De app op film, met het echte geluid: dezelfde marimba en darbuka die een kind
na een les hoort. Geen namaak en geen voice-over eroverheen.

| Bestand | Verhouding | Waarvoor |
|---|---|---|
| `store/video/nl/intro-verhaal.mp4` | 1080×1920 | TikTok, Reels, Shorts, advertenties |
| `store/video/nl/intro-vierkant.mp4` | 1080×1080 | Instagram in de tijdlijn |
| `store/video/nl/intro-breed.mp4` | 1920×1080 | YouTube |
| `store/video/nl/intro-appstore.mp4` | App Store-maat | app preview, niet voor social |

Zes talen: vervang `nl` door `fr`, `de`, `es`, `it` of `en`.

**Terug met:** `npm run intro`

**Wat erin zit**, zodat je weet waar je knipt: een titelkaart van 2,8 seconden,
dan **zeven schermen van de echte app van elk 3,2 seconde** met een vinger die
tikt — het pad, leren, de letters, een les, de geschiedenisfilmpjes, schrijven,
een woord — en een eindkaart van 3,3 seconden. Totaal bijna dertig seconden.

Die zeven blokken zijn je bouwstenen. Wil je één scherm los, knip dan op
2,8 + (n × 3,2) seconden.

## Geluid

**432 opnames**, en dat is het cijfer uit je advertentie:

| Map | Aantal | Wat |
|---|---|---|
| `src/audio/letters/` | 28 | elke letter van het Arabische alfabet |
| `src/audio/woorden/` | 304 | elk woord uit de cursus |
| `src/audio/zinnen/` | 100 | elke zin uit de cursus |

Het zijn `.wav`-bestanden met de Latijnse schrijfwijze als naam, dus
`salam.wav`, `khobz.wav`, `atay.wav`. CapCut leest ze rechtstreeks.

**Dit is je sterkste materiaal en het wordt het vaakst vergeten.** "Geen
computerstem" is een bewering zolang je hem uitspreekt. Laat je in plaats
daarvan één opname horen — een echte stem die `salam` zegt — dan is het geen
bewering meer. Vijf seconden stilte van de verteller doen hier meer dan vijf
zinnen.

**Muziek:** die zit in de introfilms, niet apart. Wil je alleen de muziek, haal
dan het geluidsspoor uit `intro-breed.mp4`; in CapCut kun je de video
toevoegen, het beeld loskoppelen en weggooien. Het is je eigen muziek, dus er
zit geen rechtenprobleem aan.

## Schermafdrukken van de app

Tien schermen per maat, in zes talen, en het zijn foto's van de draaiende app
en geen mock-ups.

| Map | Maat |
|---|---|
| `store/screenshots/nl/iphone-65/` | 1284×2778 — **gebruik deze voor video** |
| `store/screenshots/nl/iphone/` | kleinere iPhone |
| `store/screenshots/nl/ipad/` | tablet |
| `store/screenshots/nl/play/`, `play-7/`, `play-10/` | Android, telefoon en twee tablets |

De tien heten `1-pad.png` tot en met `10-aanbod.png`: het pad, leren, de
letters, een les, de geschiedenis, schrijven, woorden, spelen, jij, en het
aanbod.

**Terug met:** `npm run screenshots`

## Logo en merk

`brand/logo/` — achttien bestanden, elk als `.png` én als `.svg`:

| Bestand | Waarvoor |
|---|---|
| `logo.png` / `.svg` | het volledige logo |
| `logo-wit.png` | op een donkere achtergrond |
| `logo-zwart.png` | op een lichte achtergrond |
| `logo-kort.png` | smalle plekken |
| `icoon.png` | het app-icoon |
| `merk.png` | het woordmerk alleen |
| `fnek.png` | de achtpuntige ster los |

**Gebruik de `.svg` als CapCut hem aankan** — die blijft scherp op elk formaat.
Lukt dat niet, dan de `.png`.

**Laat een beeldgenerator nooit het logo natekenen.** Een logo dat bijna klopt
is erger dan geen logo.

**Terug met:** `npm run brand`

## Platen met tekst erop, kant-en-klaar

Dit scheelt je het meeste werk: vijf campagneplaten per taal, in twee
verhoudingen, met de kop er al op.

`brand/social/posts/nl/` — tien bestanden per taal:

| Plaat | Kop |
|---|---|
| `1-oma-verhaal.png` / `-vierkant.png` | Je kind verstaat oma wel. / Antwoorden lukt alleen niet. |
| `2-stem-…` | 432 opnames, geen computerstem. |
| `3-schrift-…` | Het Arabische schrift, letter voor letter. |
| `4-gratis-…` | Beginnen kost niets. |
| `5-geschiedenis-…` | Veertien filmpjes uit de geschiedenis van Marokko. |

Ook in `brand/social/`: `profielfoto.png`, `banner-youtube-nl.png`,
`omslag-facebook-nl.png`.

En `store/marketing/nl/`: `social-vierkant.png`, `social-verhaal.png`,
`feature-graphic.png`.

**Terug met:** `npm run social` en `npm run marketing`

## De boeken

| Wat | Waar |
|---|---|
| Omslagen en platen van de reeksen | `brand/reeksplaten/` — `sba-verhaal.png`, `sleutels-verhaal.png`, `app-verhaal.png` |
| Citaten uit de boeken, als plaat | `brand/citaten/nl/` — negen per taal, bijv. `deel03-h1-vierkant.png` |
| De boeken zelf | `store/sleutels/sleutels-1-nl.pdf` tot en met `-15-`, en `de-reeks.pdf` |
| De prentenboeken | `store/prentenboek/` |

**Terug met:** `npm run sleutelplaten`, `npm run citaten`, `npm run sleutels -- --deel 1`

## Geschiedenis

`brand/helden/` — de figuren uit de geschiedenisfilmpjes als plaat, in twee
verhoudingen: `tariq-verhaal.png`, `battuta-verhaal.png` en de vierkante
versies, per taal in een eigen map.

De filmpjes zelf zitten in de app en komen voorbij in `intro-*.mp4`, bij het
blok *geschiedenis* — dat is het vijfde scherm, dus op 2,8 + 4 × 3,2 = **15,6
seconden**.

## Alles in één keer terughalen

Elk op een eigen regel, en reken op een kwartier voor de hele reeks.

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run brand } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run social } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run intro } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run screenshots } else { "darija-kids niet gevonden onder $HOME" }
```

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p run marketing } else { "darija-kids niet gevonden onder $HOME" }
```

## Wat je in de film mag zeggen

Alles hieronder is nagemeten en staat zo in de winkel. Verzin er niets bij: een
advertentie met een getal dat niet klopt geeft problemen bij twee winkels én
bij de ACM.

| Mag | Nagemeten |
|---|---|
| 432 opnames, geen computerstem | 28 + 304 + 100 bestanden in `src/audio/` |
| 304 woorden en 100 zinnen | uit `lexicon.ts` |
| alle 28 Arabische letters, met hun drie vormen | uit `alphabet.ts` |
| 17 units, van het alfabet tot de souq | uit `curriculum.ts` |
| veertien filmpjes uit de geschiedenis van Marokko | uit `history.ts` |
| de eerste vier lessen gratis, geen account, geen advertenties | zo staat het in de app |

**Niet zeggen:** dat een kind vloeiend wordt, dat het in zoveel weken lukt, of
hoeveel kinderen het gebruiken. Het eerste is niet waar, het tweede weten we
niet, en het derde weten we nog niet.

## En het script

Het draaiboek voor de advertentie staat in `store/lancering/reclamefilm.md`:
zeven scènes met tijdcode, wat de stem zegt, wat er in beeld staat, en de
beeldprompts — in het Nederlands, Frans en Engels. Dat werkt in CapCut net zo
goed als in Steve AI; alleen zet je de scènes daar zelf achter elkaar in plaats
van ze te laten genereren.
