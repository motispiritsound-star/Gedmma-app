# Dilimiz — merkbrief

> **Status:** de naam is gekozen — **Dilimiz**. De rest van dit document
> (palet, vorm, mascotte, toon) is nog voorstel.

## De naam: Dilimiz

**Gekozen op 20 oktober 2026 door de eigenaar.** Turks voor *"onze taal"*.

Het is richting 5 hieronder — het bezittelijke. Wat die richting voor zich
heeft: het is kort, het is één Turks woord, het is in elke Europese taal te
zeggen en te typen, en het zegt in één woord waar de app over gaat. Een ouder
die het ziet, snapt het meteen; dat is meer dan `Zeytin` of `Turkuaz` doen.

**Het bezwaar dat ik bij die richting noemde, staat er nog en is geen reden om
iets te veranderen — het is iets om in de teksten op te lossen.** "Onze taal"
veronderstelt dat de lezer erbij hoort, en een deel van de doelgroep twijfelt
daar juist aan: het kind dat Turks begrijpt maar niet spreekt, de niet-Turkse
ouder die meeleert, het gezin dat thuis Koerdisch of Zaza spreekt. Voor hén
mag "onze" geen toelatingseis worden.

Daarom, in de teksten:

- **Het "onze" is een uitnodiging, niet een lidmaatschap.** Het welkomstscherm
  zegt wat de naam betekent en meteen daarna voor wie de app is — ook voor wie
  nog niets kan zeggen, ook voor wie thuis een andere taal spreekt.
- **Nergens "echte Turken" of iets wat daarop lijkt.** Niet in de app, niet in
  de winkelvermelding, niet in de teksten voor ouders.
- **De winkelvermelding zegt wat het is**, want `Dilimiz` alleen zegt een
  Nederlandse of Duitse ouder niets: *"Dilimiz — Turks voor kinderen"*.

**Wat nog nagekeken moet worden, en dit blokkeert de winkel:** het domein
(`dilimiz.eu`, `.app` of `.com`) en de vrijheid van gebruik — EUIPO, Benelux,
en of de naam al in de App Store of Google Play staat. `dilimiz` is een
gewoon Turks woord, en dat is voor een merknaam zowel een voordeel
(begrijpelijk) als een risico (moeilijker te beschermen, en waarschijnlijk al
in gebruik door iets anders). Laat een merkcheck doen; dit is geen juridisch
advies. Zie `decisions.md` B-2.

---

## De richtingen waaruit gekozen is

> Hieronder staat de afweging zoals hij voorlag, als vastlegging van waarom
> het Dilimiz werd en niet iets anders.

## Harde grens: niets van Darijaforkids

Geen naam, geen logo, geen illustratie, geen kleur, geen lettertype, geen
schermtekst en geen mascotte komt mee. Nagemeten en vastgelegd:

| Darijaforkids | Dilimiz |
|---|---|
| Mascotte: Sba, een leeuw | Een trekvogel (voorstel, zie §Mascotte) |
| Zegel: khatim, uit de Marokkaanse vlag | Geen vlagafgeleide vorm. Zie §Waarom geen vlag |
| Motief: zellige-tegels | İznik-achtige plantvorm, eigen tekening |
| Kleuren: `#f59e0b` saffraan, `#e2603c` terra, `#14b8a6` zellige, `#22c55e` mint, `#0d1220` nacht | `#2f4fa8` çini, `#f2994a` kayısı, `#5fa845` fıstık, `#d94f70` gül, `#1d1b3a` gece |
| Lettertype: Baloo 2 | Nunito |
| Donkere app met nachtblauw als grondtoon | Lichte app met koel papier als grondtoon |

`src/merk/kleuren.test.ts` controleert dat geen enkele kleurwaarde uit de
linkerkolom in deze app voorkomt. Dat is geen symboliek: een
zoek-en-vervang die één hex-waarde laat staan is precies hoe twee apps op
elkaar gaan lijken.

## Naamrichtingen

Vijf richtingen, van veilig naar gedurfd. Per richting wat het oplevert en
wat het kost. **Geen aanbeveling zonder jouw keuze** — maar als je er één
wilt horen: richting 2.

### 1. Het concrete ding — `Kelime Kutusu`, `Söz Kutusu`

"Woordendoos". Een kind begrijpt direct wat erin zit.
- **Voor:** letterlijk, onschuldig, niet politiek, makkelijk uit te leggen.
- **Tegen:** twee woorden en zeven lettergrepen. Een Duitse of Franse ouder
  spreekt het niet goed uit en typt het niet goed in de winkelzoekbalk. Dat
  laatste is een echt probleem.

### 2. Het korte Turkse woord — `Turkuaz`, `Zeytin`, `Papatya`, `Minik`

Eén Turks woord dat in elke Europese taal te zeggen is.
- **`Turkuaz`** (turkoois) — de kleur die naar het land is vernoemd. Verwijst
  naar Turkije zonder de vlag, de politiek of de natie. Bestaat al in
  Nederlands, Duits, Frans en Engels, dus niemand struikelt erover. Maar:
  "turquoise" is een veelgebruikt woord, dus de winkelzoekbalk en het domein
  zijn druk — en de kleur zou dan wel echt het merk moeten dragen.
- **`Zeytin`** (olijf) — warm, mediterraan, eetbaar, kindvriendelijk. Goed te
  zeggen. Zegt niets over taal of over Turkije.
- **`Papatya`** (madeliefje) — zacht, mooi, en in Turkije een alledaags woord.
  Mogelijk te meisjesachtig voor een app die ook jongens van tien moet pakken.
- **`Minik`** (kleintje) — wat ouders tegen kinderen zeggen. Kort, lief,
  uitspreekbaar. Groeit niet mee met een jongere van zestien.
- **Voor:** kort, eigen, goed vindbaar als het domein vrij is.
- **Tegen:** zegt op zichzelf niet dat het om Turks leren gaat. De
  winkelbeschrijving moet dat werk doen.

### 3. Het werkwoord van het kind — `Haydi!`, `Söyle`, `Konuş`

"Kom op!", "Zeg het", "Praat".
- **`Haydi!`** is wat een Turkse ouder honderd keer per dag zegt. Het is een
  duw, geen les. Dat past exact op het kernprobleem: het kind dat begrijpt
  maar niet spreekt.
- **Voor:** sterkste inhoudelijke match. Energiek, en het leeftijdsbereik is
  breed.
- **Tegen:** een uitroepteken in een appnaam is lastig in winkelvermeldingen
  en domeinnamen. `haydi` zonder teken verliest de helft van de lading.

### 4. De brug — `Köprü`, `İki Ev`, `Yolculuk`

"Brug", "Twee huizen", "Reis".
- **Voor:** benoemt de diaspora-ervaring precies. Ouders zullen dit mooi
  vinden.
- **Tegen:** het is de blik van de ouder, niet van het kind. Een kind van zeven
  heeft geen brugmetafoor nodig, en de app wordt door een kind gebruikt. Ook:
  "twee huizen" kan als opdracht voelen in plaats van als geschenk.

### 5. Het bezittelijke — `Bizim Dil`, `Bizce`

"Onze taal", "Op onze manier".
- **Voor:** warm, inclusief binnen het gezin.
- **Tegen:** "onze" sluit uit wie er niet bij hoort — en de app is ook voor het
  kind met één Turkse ouder, voor de niet-Turkse partner die meeleert, en voor
  de leerkracht die nieuwsgierig is. Dat is een echt bezwaar, niet een
  theoretisch.

### Wat jij nog moet doen

1. Kies een richting, of combineer (`Haydi` + ondertitel "Turks voor kinderen").
2. **Controleer vrijheid van gebruik vóór je iets vastlegt:** domein,
   merkenregister (EUIPO en Benelux), en of de naam al in de App Store of
   Google Play staat. Dit is geen juridisch advies; laat een merkcheck doen.
3. Leg het domein vast. Pas daarna hernoemen — de app is zo gebouwd dat dat
   één bestand is (`src/merk/merk.ts`), niet 267.

## Waarom geen vlag en geen natiesymbool

Darijaforkids draagt de khatim uit de Marokkaanse vlag. Dat werkte daar, maar
het is hier een slecht idee, om drie redenen die niets met esthetiek te maken
hebben:

1. **De doelgroep is niet één groep.** Turkse, Koerdische, Zaza-, Arabisch-,
   Lazische en Circassische gezinnen uit Turkije zitten allemaal in Europa, en
   een deel daarvan heeft met de staatssymboliek een verhouding die niet neutraal
   is. Een vlag op het pictogram sluit gezinnen uit die de taal wél willen
   doorgeven.
2. **Een schoolplein is geen politiek podium.** Een app die een kind op een
   Duitse basisschool openklapt, hoeft geen standpunt te zijn.
3. **Het is onnodig.** Turkoois, İznik-blauw, een granaatappel, een trekvogel —
   er is genoeg beeldtaal die onmiskenbaar uit Turkije komt zonder de staat
   erbij te halen.

Hetzelfde geldt voor de halve maan met de ster, de Atatürk-silhouet en de
grijze wolf. Niet in dit merk.

## Visuele identiteit

### Grondtoon: licht

Darijaforkids is 's nachts gezet: donkerblauw oppervlak, warme accenten
erboven. Deze app is 's ochtends gezet: koel papier, diep çini-blauw, en de
warme kleuren als accent. Dat is de snelste manier om twee apps naast elkaar
niet op elkaar te laten lijken, en het past bij de inhoud — İznik-keramiek is
blauw op wit, niet goud op nacht.

Een donkere stand is er wel, maar als tweede en niet als eerste.

### Palet

| Rol | Naam | Licht | Donker | Waarom |
|---|---|---|---|---|
| Hoofdaccent | `cini` | `#2f4fa8` | `#6f8fe0` | İznik-kobalt. Draagt het merk |
| Warm accent | `kayisi` | `#f2994a` | `#f6b273` | Abrikoos. Voortgang, beloning |
| Goed | `fistik` | `#5fa845` | `#7fc264` | Pistache. "Juist" |
| Nadruk / fout | `gul` | `#d94f70` | `#e8778f` | Roos. Terughoudend gebruikt |
| Papier | `kagit` | `#f6f8fd` | `#1d1b3a` | Koel wit / diep gece |
| Inkt | `murekkep` | `#16213e` | `#eef1f8` | |

Vier accenten, niet zes. Een kind kiest er één voor zichzelf (`cini`,
`kayisi`, `fistik`, `gul`); alle vier moeten leesbaar zijn in beide standen.
`src/merk/kleuren.test.ts` meet dat.

### Vorm

- **Rondingen, niet hoeken.** Radius 16–24px op kaarten, volledig rond op
  knoppen. Een app voor een zevenjarige mag geen kantoortoepassing lijken.
- **Eén motief:** een İznik-achtige tulp/anjer-vorm, eigen tekening, als
  waterteken op unitkoppen en op het diploma. Geen tegelpatroon — dat is
  zellige en dus van de andere app.
- **Pictogrammen:** emoji in de inhoud (gratis, universeel, en een kind leest
  ze sneller dan lijntekeningen), eigen SVG's in het chroom.

### Lettertype

**Nunito** voor koppen en Turkse woorden, systeemstapel voor doorlopende tekst.
Nunito is rond en vriendelijk, en — dat is hier het punt — heeft volledige
dekking voor `ı İ ğ Ğ ş Ş ç Ç ö Ö ü Ü`. Een lettertype dat op `ğ` terugvalt
naar een ander font maakt van het belangrijkste leerpunt van de app een
rommelige regel.

Niet Baloo 2: dat is de kop van Darijaforkids.

### Logo

Tijdelijke plaatshouder in `src/merk/Merkteken.tsx`: de İznik-tulp met de
beginletter van de gekozen naam erin, als SVG, in de accentkleur. Netjes,
schaalbaar, en bedoeld om vervangen te worden. Geen definitief logo zonder
naamkeuze — een logo voor een naam die verandert is weggegooid werk.

## Mascotte (voorstel)

**Een witte trekvogel, een leylek (witte storch).**

De reden is niet esthetisch maar inhoudelijk: witte storchen broeden in
Nederland, Duitsland, België en Frankrijk en trekken weg naar het zuiden; in
Turkije zijn ze een vertrouwd beeld, en de stad Eskişehir heeft er een wijk
vol. Een vogel met twee plekken waar hij thuis is, is precies het kind in de
doelgroep — zonder dat iemand dat hoeft uit te leggen.

Praktisch: wit, rode snavel, lange poten, makkelijk te tekenen, herkenbaar op
48 pixels, en geen leeuw.

**Wat eerst nagekeken moet worden:** de trekroutes hierboven zijn de
hoofdlijn, maar als de mascotte in een les iets over vogels zégt, hoort daar
een bron bij. Zie `learning-curriculum.md` §Cultuur: geen feit zonder
herkomst. Als mascotte heeft hij geen bron nodig; als lesinhoud wel.

Naamvoorstellen voor de vogel: `Leylo`, `Pati`, `Kanat` ("vleugel"),
`Bulut` ("wolk"). Alternatieve mascottes als de vogel niet bevalt: een
Van-kat (wit, twee verschillende ogen — onmiskenbaar Turks), of een
granaatappel met een gezicht.

## Toon

- **Tegen het kind:** `sen`, kort, concreet, nooit sarcastisch. "Yine!"
  (nog eens) en niet "Fout".
- **Tegen de ouder:** `siz`, volwassen, zonder verkooppraat. Een ouder die een
  abonnement overweegt wil weten wat het kost en wat het kind ervoor krijgt,
  niet dat de app "revolutionair" is.
- **Nooit:** schuldgevoel ("je bent je reeks kwijt!"), aftelklokken, of
  "andere kinderen hebben al…".

## Wat hierna nog moet

1. Naam kiezen (jij). Domein en merkcheck (jij).
2. Logo tekenen zodra de naam er is.
3. Winkelpictogram, startscherm en vermeldingsbeelden.
4. Winkelteksten in vier talen.
