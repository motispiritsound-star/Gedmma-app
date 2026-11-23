# Alles wat je in CapCut kunt gebruiken

> **Let op — vier dingen hieronder dragen tekst in beeld die sinds 23 november
> niet meer waar is.** Er zijn geen gratis lessen meer en geen proefperiode: de
> app is gratis te downloaden, de cursus is een abonnement, en dat wordt op het
> eerste scherm gevraagd. Na het betalen gaat alles in één keer open. De
> onderbouwing staat in de aantekening boven `magLeren` in
> `src/engine/store.ts`; het besluit staat in `docs/STAND.md` onder
> *23 november: het gratis deel eruit, de betaalmuur bij de download*.
>
> | Wat | Wat erop staat | Waar het hieronder staat |
> |---|---|---|
> | de slotkaart van `intro-*.mp4`, vanaf 25,2 seconden | "Gratis beginnen", met een omgerekende maandprijs | *Film* |
> | `10-aanbod.png` van vóór 23 november | de voetregel met de proefperiode van drie dagen | *Schermafdrukken* |
> | `4-gratis-*.png` van vóór 23 november | "Beginnen kost niets." | *Platen met tekst erop* |
> | de al ingesproken reclamefilms | "De eerste vier lessen zijn gratis" | *En het script* |
>
> Een advertentie die iets gratis belooft dat de app niet geeft, valt onder
> Apple-richtlijn 2.3.1, en die geldt woordelijk "whether within or outside of
> the App Store" — dus ook een bericht op een Facebook-pagina.

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

**De eindkaart is je bouwsteen niet.** Die begint op 2,8 + 7 × 3,2 = **25,2
seconden**, en in een opname van vóór 23 november draagt hij twee regels die
niet meer kunnen: een knop die zegt dat je gratis kunt beginnen, en een
omgerekende maandprijs zonder het bedrag dat werkelijk wordt afgeschreven
ernaast. Die teksten staan als gewone tekst in `dev/intro-copy.ts`, in alle zes
de talen; wat er met die kaart moet gebeuren staat in
`store/lancering/socials.md`, onder *De slotkaart van de introfilm klopt niet*,
en dat bestand is er de eigenaar van.

**Knip dus vóór 25,2 seconden, in elke verhouding en in elke taal**, en zet er
je eigen eindkaart achter. Wil je de kaart uit de film tóch gebruiken, lees hem
dan eerst zelf van het beeld in de opname die je in handen hebt — niet uit dit
bestand en niet uit je hoofd. Een `intro-*.mp4` die al op je schijf staat, is
niet meegegaan met wat er sinds die dag aan `dev/intro-copy.ts` is veranderd.

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

Foto's van de draaiende app, geen mock-ups. Tien schermen per maat in het
Nederlands, Frans, Duits, Spaans en Italiaans; in het Engels negen.

| Map | Maat |
|---|---|
| `store/screenshots/nl/iphone-65/` | 1284×2778 — **gebruik deze voor video** |
| `store/screenshots/nl/iphone/` | kleinere iPhone |
| `store/screenshots/nl/ipad/` | tablet |
| `store/screenshots/nl/play/`, `play-7/`, `play-10/` | Android, telefoon en twee tablets |

De tien heten `1-pad.png` tot en met `10-aanbod.png`: het pad, leren, de
letters, een les, de geschiedenis, schrijven, woorden, spelen, jij, en het
aanbod. **De tiende is er niet in het Engels**, en dat is geen vergissing: dat
is de enige opname met bedragen erop, en de Engelse vermelding is bij beide
winkels de terugval voor de hele wereld — euro's op een plaatje voor iemand die
dollars betaalt is een afkeuring. Zo staat het bij `langs` van de tiende opname
in `scripts/make-screenshots.mjs`.

**En `10-aanbod.png` is de enige die iets belooft in plaats van iets te
tonen.** Daar staan de prijzen op, en wat er vóór 23 november van gemaakt is
klopt niet meer: in de voetregel stond de proefperiode van drie dagen, en die
bestaat niet. Het script schrijft die regel niet meer — maar een plaatje dat al
op je schijf staat verandert daar niet van. Maak hem dus opnieuw voordat je hem
in beeld brengt. Er staat nu "€ 2,50 p/m" groot op, met "€ 29,99 per jaar, nu
50% korting" eronder (`AANBOD` in `scripts/make-screenshots.mjs`), dus gebruik
hem niet zolang die aanbieding niet werkelijk in de winkel staat: zie
`docs/STAND.md`, *23 november: de tijdelijke actie van 50% op het jaar*.

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
| `4-abonnement-…` | Eén abonnement, alles open. |
| `5-geschiedenis-…` | Veertien filmpjes uit de geschiedenis van Marokko. |

**De vierde is op 23 november vervangen.** Hij heette `4-gratis-…` en zei
"Beginnen kost niets."; dat is niet meer waar. Nu heet hij `4-abonnement-…` en
zegt hij "Eén abonnement, alles open." met daaronder "Geen advertenties, geen
gegevens over je kind." — zie `TEKST` in `scripts/make-social.mjs`.

**En `npm run social` ruimt de oude niet op.** Het schrijft nieuwe bestanden in
dezelfde map en laat de rest staan, dus een `4-gratis-*.png` van eerder blijft
liggen en is in CapCut net zo makkelijk te pakken als de goede. Zo zie je of er
nog zo'n bestand staat:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { Get-ChildItem (Join-Path $p 'brand\social\posts') -Recurse -Filter '4-gratis-*.png' -ErrorAction SilentlyContinue | Select-Object FullName } else { "darija-kids niet gevonden onder $HOME" }
```

En zo gooi je ze weg. Wat er hóórt te staan komt terug met `npm run social`,
onder de nieuwe naam, dus je gooit niets weg dat je nog nodig hebt:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { Get-ChildItem (Join-Path $p 'brand\social\posts') -Recurse -Filter '4-gratis-*.png' -ErrorAction SilentlyContinue | Remove-Item -Verbose } else { "darija-kids niet gevonden onder $HOME" }
```

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
| veertien filmpjes uit de geschiedenis van Marokko | uit `history.ts` — veertien kaarten in `HISTORY` |
| gratis te downloaden, geen account, geen advertenties, werkt offline | `trustLine` in `src/site/copy.ts`, in zes talen |
| er wordt niets van je kind verzameld | zonder account is er niets om te verzamelen |
| na het betalen gaat alles in één keer open | zo werkt het sinds 23 november; geen porties van acht lessen meer |

**Niet zeggen:** dat een kind vloeiend wordt, dat het in zoveel weken lukt, of
hoeveel kinderen het gebruiken. Het eerste is niet waar, het tweede weten we
niet, en het derde weten we nog niet.

**En sinds 23 november ook niet:** dat er lessen gratis zijn, dat beginnen
niets kost, of dat er een proefperiode is. Er is er geen van de drie. Het enige
dat gratis is, is de download, en dat is sterk genoeg om het zo te zeggen.

**Noem je een prijs, dan staat het bedrag dat werkelijk wordt afgeschreven
erbij, en ervóór.** De jaarprijs is € 59,99 en de maandprijs € 6,99; zolang de
actie loopt is het eerste jaar € 29,99. Dus "€ 29,99 voor het eerste jaar
(€ 2,50 per maand)", nooit "€ 2,50 per maand" alleen — Apple wees deze app eerder
af op richtlijn 3.1.2(c) omdat de omrekening opvallender stond dan het bedrag
dat van de rekening ging. De einddatum van de actie is nog niet gekozen, dus
verzin er geen. De volledige regels om te plakken staan in
`store/lancering/reclamefilm.md`, onder *De actieprijs*.

## En het script

Het draaiboek voor de advertentie staat in `store/lancering/reclamefilm.md`:
zeven scènes met tijdcode, wat de stem zegt, wat er in beeld staat, en de
beeldprompts — in het Nederlands, Frans en Engels. Dat werkt in CapCut net zo
goed als in Steve AI; alleen zet je de scènes daar zelf achter elkaar in plaats
van ze te laten genereren.

**Lees daar eerst het blok bovenaan.** De films die al van dat script zijn
gemaakt, zeggen ingesproken "De eerste vier lessen zijn gratis", en die mogen
niet in de campagne tot ze opnieuw zijn ingesproken. De nieuwe slotregel staat
in scène 6 van dat bestand en, in zes talen, in `docs/VIDEO.md` onder *The
closing line, per voicing*. In het Nederlands zegt de stem:

> Darijaforkids. Gratis te downloaden, zonder advertenties.

En in beeld staat:

> darijaforkids.eu · Gratis te downloaden · Geen advertenties

Allebei woordelijk zoals in `docs/VIDEO.md` en in scène 13 van
`docs/film/filmscript-nl.txt`. Verander ze hier niet zonder ze daar ook te
veranderen: twee documenten die twee verschillende slotregels voorschrijven is
erger dan één verouderde.
