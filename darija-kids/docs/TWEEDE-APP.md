# Een tweede app uit deze codebase

Besloten op 20 oktober 2026: er komt een leerapp voor de Turkse diaspora in
Europa, geïnspireerd op Darijaforkids maar met een eigen naam, logo en inhoud.
Dit bestand is de overdracht. Het is geschreven vanuit de Darijaforkids-kant,
want dat is de kant die weet wat er in zit.

## De vorm: aparte repository, en kopiëren

Niet één codebase die twee apps bouwt, en geen gedeelde bibliotheek. Een
nieuwe repository, een kopie van deze, en de verdubbeling bewust aanvaard.

Dat voelt verkeerd en is het niet. Je weet nu nog niet welke delen werkelijk
gedeeld zijn — dat leer je pas door de tweede app te bouwen. Abstraheer je nu,
dan gok je, en een verkeerde abstractie kost meer dan dubbele code.

Praktisch pleit alles er ook voor: aparte winkelvermelding, eigen
ondertekensleutels, eigen Cloudflare-project, eigen cijfers. Dat heb je
sowieso allemaal nodig.

**Eén discipline erbij.** Houd een kort lijstje bij van bestanden die in beide
apps identiek zijn. Repareer je daar iets, port het dan. Dat is vijf minuten
per keer en het voorkomt dat ze na een half jaar niet meer op elkaar lijken.
Wil je later tóch één ding uittrekken, maak daar dan `scripts/` van: dat is
het deel dat het minst uiteenloopt en het meest oplevert.

## Wat je erft, en wat niet

| Laag | Regels | Mee naar Turks |
|---|---|---|
| `scripts/` | 23.122 | vrijwel alles |
| `src/engine/` | 9.358 | vrijwel alles |
| `src/pages/` + `src/ui/` | 18.406 | structuur ja, merk nee |
| `src/content/` | 32.681 | **niets** |

### Wat letterlijk mee kan

- **`scripts/`** — de hele uitgeefketen. Bouwen (`maak-aab.mjs`, `ios-plist.mjs`),
  versies bijhouden (`lib/versies.mjs`), release-notities (`lib/nieuws.mjs`),
  de filmmachine (`make-intro.mjs` + `dev/intro.ts`), de plaatgeneratoren
  (`make-weetje`, `make-sketch`, `make-tafereel`, `make-citaten`), de
  winkelkoppeling (`lib/play.mjs`, `naartrack.mjs`, `rechten.mjs`,
  `crashcheck.mjs`, `downloadcheck.mjs`). Dit is maanden werk dat je niet
  opnieuw doet.
- **`src/engine/`** — gespreide herhaling, voortgang, reeksen, insignes,
  bonusrondes, de hele betaalmachine (`billing.ts`), meldingen
  (`herinnering.ts`), delen en beoordelingen.
- **`src/ui/kit.tsx`** en `OuderPoort.tsx` — knoppen, panelen, schakelaars, en
  de ouderpoort die bij een kinderapp niet mag ontbreken.
- De bouwopzet: Vite, Capacitor, de testharnas, `vite.config.ts`, de
  Cloudflare-worker in `server/`.

### Wat eruit moet en opnieuw gemaakt

Alles in `src/content/`. Dat is 32.681 regels en het is allemaal Marokkaans:
304 woorden, 100 zinnen, 28 Arabische letters, 15 boeken over Marokkaanse
geschiedenis, de verhalen, het prentenboek, de uitspraakgids.

En de merklaag in `src/ui/`: `Khatim.tsx` (het zegel van de Marokkaanse vlag),
`Motief.tsx` (zellige), `Mascot.tsx` (Sba de leeuw), de kleuren in `index.css`.

## Het ding dat je ontwerp verandert: Turks is Latijns schrift

Dit is geen detail. Het meest onderscheidende deel van Darijaforkids komt
**niet** mee:

- de 28 Arabische letters en hun vier vormen
- het naschrijven met je vinger (`/bonus/schrijven`)
- rechts-naar-links lezen, het Naskh-lettertype, de bidi-tests
- de keuze "Arabisch schrift, klanken, of allebei" in het welkomstscherm

Een Turkse app heeft wél een alfabetles nodig — `ı`, `ğ`, `ş`, `ö`, `ü`, `ç`
zijn een echt struikelblok voor wie Nederlands of Duits gewend is — maar dat
is een ander ontwerp, geen vertaling. Datzelfde geldt voor wat Turks moeilijk
maakt en Darija niet: **klinkerharmonie** en **agglutinatie**. Een woord dat
met acht achtervoegsels aan elkaar plakt vraagt een oefenvorm die hier niet
bestaat.

Reken dus op: de machine erven, de les opnieuw ontwerpen.

## De identificatoren die moeten wijzigen

267 bestanden noemen de merknaam. Dit zijn de plekken waar het ertoe doet:

| Wat | Nu | Waar |
|---|---|---|
| App-id | `app.darijaforkids.learn` | `capacitor.config.ts`, `android/app/build.gradle`, iOS-project |
| App-naam | `Darijaforkids` | `capacitor.config.ts` |
| Abonnement jaar | `app.darijaforkids.yearly` | `src/engine/billing.ts` |
| Abonnement maand | `app.darijaforkids.monthly` | `src/engine/billing.ts` |
| E-boek | `app.darijaforkids.ebook` | `src/engine/billing.ts` |
| Domein | `darijaforkids.eu` | `src/site/links.ts` |
| Postdomein | `post.darijaforkids.eu` | `src/site/links.ts` |
| Apple ID | `6813964474` | `src/site/links.ts`, `src/engine/beoordeling.ts` |

Een zoek-en-vervang over de merknaam brengt je ver, maar niet overal: de
teksten in `src/i18n/` noemen hem in zinnen, en die moeten met de hand.

## De eerste stappen

1. **Nieuwe repository**, en daarin een kopie van deze zonder `node_modules`,
   `dist`, `site`, `brand`, `store/video`, `store/weetjes`.
2. **Naam en merk kiezen** vóór je iets hernoemt. Een zoek-en-vervang doe je
   één keer goed of drie keer half.
3. **`src/content/` leegmaken** en vervangen door een eerste Turkse unit. Begin
   met begroeten en familie — dat is waar Darijaforkids ook mee begint, en het
   is waar een kind in de zomer iets aan heeft.
4. **Het alfabet opnieuw ontwerpen**, niet vertalen. Zie hierboven.
5. **Eigen winkelaccounts**: nieuwe app in Play Console en App Store Connect,
   nieuwe ondertekensleutel, nieuwe abonnementsproducten met dezelfde
   structuur (jaar, maand, e-boek).

## Wat alleen jij kunt doen

- Een naam en een domein kiezen, en het domein vastleggen.
- De app aanmaken in beide consoles, met eigen abonnementen — en daar meteen
  de **proefperiode op allebei de plannen** zetten. Bij Darijaforkids stond die
  op het jaarplan wekenlang niet, terwijl het scherm hem wél beloofde. Dat is
  de duurste les van 20 oktober en hij is gratis over te nemen.
- Beslissen of de boekenreeks meekomt. Vijftien boeken over Turkse
  geschiedenis is een eigen project, geen bijlage.

## En de afweging die hierbij hoort

Op 20 oktober stond Darijaforkids op 119 downloads, 2 betaalde plannen en $54.
Het model is nog niet bewezen, en het knelpunt is bereik en niet product. Een
tweede app lost dat niet op: hij halveert de tijd die eraan besteed kan worden
en erft dezelfde onzekerheid.

Daar staat tegenover dat de Turkse markt in Europa een veelvoud is, en dat de
machine er al ligt. Dat is een echt argument.

Het is een besluit en geen vergissing — maar het hoort hier te staan, zodat
over drie maanden na te lezen is wat er bekend was toen het genomen werd.
