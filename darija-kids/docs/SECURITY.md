# Security-audit

Uitgevoerd op 28 september 2026 op commit `8eb920b`, als externe pentest: er is
gezocht naar wat een aanvaller kan, niet naar wat de code bedoelt. Alle tests
waren niet-destructief en op de eigen kopie; er is niets tegen de productie-
omgeving gedraaid en er is voor dit rapport geen regel code gewijzigd.

**Samenvatting.** Geen kritieke bevindingen. Twee hoge, waarvan één die geen
aanvaller nodig heeft om schade aan te richten. Drie gemiddelde. De onderdelen
waar je ze het eerst zou verwachten — SQL, XSS, CSRF, toegang tot andermans
boeken, de koekjes, de geheimen — zijn nagelopen en in orde; onderaan staat
per stuk waarom.

---

## H1 · Een GET wist onomkeerbaar persoonsgegevens

**Risico: hoog** · `server/src/index.ts` — `wissen()`, `uitschrijven()`,
`bevestig()`.

**Wat er is.** Drie endpoints wijzigen of verwijderen gegevens op een **GET**,
met een token uit een e-mail:

```
GET /wissen?t=<token>        → DELETE uit voortgang én aanmelding
GET /uitschrijven?t=<token>  → status 'uitgeschreven', DELETE uit voortgang
GET /bevestig?t=<token>      → status 'bevestigd'
```

**Waarom dit een probleem is.** Hier is geen aanvaller voor nodig. E-mail-
clients en beveiligingsproducten halen links in een bericht vooruit op om ze te
controleren: Outlook Safe Links, de virusscanner van een bedrijf, de
linkvoorbeelden van Slack en WhatsApp. Zo'n prefetch is een gewone GET, en een
GET hier is een verwijdering.

Gevolg: iemand krijgt de mail, klikt nergens op, en zijn aanmelding is weg. Of
andersom — de scanner klikt op "bevestigen", en dan staat er in de database dat
deze persoon toestemming heeft gegeven terwijl er geen mens aan te pas kwam.
Dat laatste raakt precies wat `schema.sql` in zijn eigen kop als doel stelt: dat
"ze hebben ja gezegd" iets is dat je moet kunnen laten zien.

**Erbij, en het maakt het zwaarder.** `aanmelding.token` is één token, dat
alledrie deze dingen kan, dat nooit verloopt en dat nooit wordt vervangen. Het
staat in elke mail die deze persoon ooit heeft gekregen. Eén oude doorgestuurde
nieuwsbrief in het verkeerde postvak is daarmee een permanente wisknop op die
persoon. Entropie is het probleem niet — 24 bytes, niet te raden — maar
houdbaarheid en reikwijdte wel.

**Oplossing.**

1. `/wissen` mag geen GET meer zijn. De link in de mail wijst naar een pagina
   met één knop, en die knop doet een POST. Dat is één extra klik voor een
   onomkeerbare handeling, en het is meteen de bevestiging die er nu niet is.
2. `/uitschrijven` blijft bereikbaar per GET, want de afmeldknop van de
   mailclient verwacht dat — maar de `List-Unsubscribe-Post`-kop die er al is,
   hoort naar een POST-adres te wijzen (RFC 8058), en dat pad mag dan de enige
   zijn die daadwerkelijk uitschrijft.
3. `/bevestig` idem: de link toont een pagina, de knop bevestigt. Dan is de
   toestemming weer een handeling van een mens.
4. Geef elk van de drie zijn eigen token, met een houdbaarheid op de bevestig-
   en wislink. De afmeldlink mag blijven leven, want die moet in een oude mail
   nog werken.

**Verwachte impact.** Het verschil tussen een lijst waarvan stilletjes rijen
verdwijnen zonder dat iemand weet waarom, en een lijst die doet wat de mensen
erop hebben gekozen. En een aantoonbare toestemming in plaats van een
aanvinkbare.

---

## H2 · De worker staat ook op een tweede, open adres

**Risico: hoog** · `server/wrangler.toml` — `workers_dev = true`.

**Wat er is.** Naast `post.darijaforkids.eu` publiceert Cloudflare dezelfde
worker op `darijaforkids-post.<subdomein>.workers.dev`. Dat adres is openbaar,
raadbaar, en staat in geen enkele documentatie van dit project.

**Waarom dit een probleem is.** Alles wat de worker doet, is daar ook
bereikbaar: `/koop`, het portaal, `/lezen`, `/blad`. Elke maatregel die je later
aan het eigen domein hangt — een WAF-regel, een snelheidslimiet, een
geoblokkade, een analyse van het verkeer — geldt daar niet. Je hebt dan één
voordeur die je bewaakt en een tweede waarvan je vergeet dat hij bestaat.

Het is op zichzelf geen lek: de CORS-controle gebruikt `env.SITE`, dus een
browser op een vreemde herkomst komt er nog steeds niet doorheen, en `/koop`
vraagt nog steeds het geheim. Maar het is een ontwikkelinstelling die in
productie is blijven staan, en dat is precies de categorie waar dit rapport naar
zocht.

**Oplossing.** `workers_dev = false` in `wrangler.toml`, en uitrollen. Het eigen
domein staat er al via `[[routes]]` met `custom_domain = true`, dus er gaat
niets verloren.

**Verwachte impact.** Eén voordeur in plaats van twee. Kost één regel.

---

## M1 · Een e-mailadres in het logboek

**Risico: gemiddeld** · `server/src/index.ts:547`.

Dit is bevinding 6 uit `AUDIT.md` en staat daar met oplossing beschreven.
Kort: `console.error('terugbetaling zonder bestelnummer', email)` zet een
adres in de Cloudflare-logs, een plek met een eigen bewaartermijn, een eigen
toegangslijst en geen verwijderknop per regel — terwijl de database zelf overal
met hashes werkt. Voor de AVG maakt het niet uit dat het in een log staat en
niet in een tabel.

---

## M2 · Het koopgeheim reist door de URL

**Risico: gemiddeld, en deels onvermijdelijk** · `server/src/index.ts` —
`koop()`.

**Wat er is.** Het geheim mag in een kop (`x-darija-geheim`) óf in de
query (`?s=`). Gumroad kan geen koppen zetten, dus in de praktijk is het altijd
de query.

**Waarom dit telt.** Een waarde in een URL komt terecht in de logs van
Cloudflare en van alles wat ertussen zit, en die logs hebben een andere
bewaartermijn en een andere toegangslijst dan een secret. Wie die logs kan
lezen, kan koopbevestigingen vervalsen: een bestelling aanmaken die nooit
betaald is, of een sleutel laten mailen naar een eigen adres.

**Wat er goed aan is.** De vergelijking is in constante tijd
(`geheimKlopt`, `koopbericht.ts:184`), dus het geheim is niet byte voor byte af
te tasten. En zonder geheim is het antwoord 403, meer niet.

**Oplossing.** Niet wegnemen — Gumroad laat geen koppen toe — maar wél
inperken: behandel dit geheim als iets dat in logs staat. Dus roteren zodra
iemand anders bij de Cloudflare-logs kan, en nooit hergebruiken voor iets
anders. Het staat al in `docs/`-stappen dat `npm run koopgeheim` hem op het
klembord zet in plaats van op het scherm; dat is de goede kant op.

---

## M3 · Vijfendertig waarschuwingen in de afhankelijkheden, alle in het gereedschap

**Risico: gemiddeld voor de werkplek, geen voor de bezoeker** ·
`darija-kids/package.json`.

`npm audit` meldt 35 kwetsbaarheden, waarvan 21 gemiddeld, 10 hoog en 4
kritiek. Dat klinkt alarmerend en is het bijna niet:

```
npm audit --omit=dev   →  found 0 vulnerabilities
```

Alle 35 zitten in bouwgereedschap: de `expo`- en `xcode`-ketens, via een oude
`uuid`. Daar komt geen bezoeker langs en er gaat geen regel van mee in de app,
de site of de worker. De productie-afhankelijkheden zijn tien pakketten en die
zijn schoon.

**Waarom het toch op de lijst staat.** Dit gereedschap draait wél op de machine
waar de ondertekensleutels staan. Een kwetsbaarheid daarin is geen risico voor
de gebruikers, maar wel voor de werkplek.

**Oplossing.** Niet `npm audit fix --force`: dat wil `expo@57` installeren, een
brekende wijziging, in de week van de lancering. Na de lancering de
expo-keten in één keer bijwerken en daarna opnieuw meten.

---

## L1 · De voortgang wordt geschreven op een onraadbaar nummer

**Risico: laag** · `server/src/index.ts` — `voortgang()`.

Wie het `id` van een aanmelding kent, mag zijn tellers schrijven. Er is geen
sessie en geen handtekening. Dat is een bewuste keuze en hij houdt stand: het
`id` is twaalf willekeurige bytes (96 bits), het staat alleen in de opslag van
de app zelf, en wat je ermee kunt schrijven zijn zes getallen die tussen 0 en
1.000.000 worden geknepen. Geen naam, geen antwoorden, geen toestel.

Het ergste dat een gestolen `id` oplevert, is een verkeerd getal in de
weekmail van die ene persoon. Dat is het niet waard om er een inlog voor te
bouwen in een app die door kinderen wordt gebruikt.

---

## Nagelopen en in orde

Dit is waar een pentest begint, en hier is niets gevonden. Het staat erbij met
de reden, zodat het niet nog een keer hoeft.

- **SQL-injectie: niet mogelijk.** Elke query gaat via `prepare(...).bind(...)`.
  Nul treffers op aaneenschakeling of interpolatie in een query, in de hele
  worker.
- **XSS: niet mogelijk.** Alle HTML uit de worker loopt door `esc()`, die
  `& < > "` vervangt, en elk attribuut in die sjablonen staat tussen dubbele
  quotes. In de site en de lezer is elke `innerHTML` een `= ''` — leegmaken,
  nooit schrijven. De naam van de koper, het enige veld dat een buitenstaander
  vult en dat op elke bladzijde wordt afgedrukt, gaat via `textContent` en via
  `fillText` op een canvas. Allebei kunnen geen opmaak uitvoeren.
- **CSRF: structureel afgedekt.** Het koekje is `SameSite=Lax`, dus een browser
  stuurt het niet mee bij een POST vanaf een vreemde site, en alle muterende
  portaal-endpoints staan achter `method === 'POST'`. (De drie GET-endpoints uit
  H1 zijn een ander probleem: daar is het token de sleutel, niet het koekje, en
  CSRF is daar dus niet het gevaar — prefetch wel.)
- **Toegang tot andermans boeken: niet mogelijk.** `/blad` vergelijkt de
  gevraagde reeks met wat er gekocht is, en `toegang()` levert die reeksen als
  `string[]` — dus `includes()` is een exacte vergelijking. Was het een string
  geweest, dan was `reeks: "s"` erdoor geglipt. `taal` wordt gestript met
  `[^a-z]`, en `deel` en `nr` gaan door `Number.isInteger`, dus er is geen pad
  uit de map te lopen.
- **Koekjes: goed gezet.** `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`,
  `Domain=.darijaforkids.eu`, `Max-Age` erop. Niet te lezen vanuit javascript,
  niet over http, niet cross-site.
- **CORS: geen sterretje.** `portaalCors` geeft het exacte adres van de site
  terug met `access-control-allow-credentials` en `vary: origin`. `welkAdres()`
  laat alleen het eigen domein en zijn `www.`-variant toe.
- **Geheimen: nergens in de repository.** Geen sleutel, geen IBAN, geen BSN —
  niet in de bestanden en niet in de historie. De enige treffer op `xkeysib-`
  is het voorbeeldvoorvoegsel in `scripts/mailsleutel.mjs` en `docs/BREVO.md`.
  `.dev.vars`, `play-api.json` en de ondertekensleutels staan in `.gitignore`
  en zijn nooit gecommit geweest.
- **Wachtwoorden: die zijn er niet.** Het portaal werkt met een inloglink, dus
  er valt geen wachtwoord te stelen, te hergebruiken of te lekken. Sleutels en
  sessietokens staan alleen als SHA-256 in de database; lekt die tabel, dan
  lekt er geen toegang mee.
- **Snelheidslimiet op het versturen van post: aanwezig, op de goede plek.**
  Zowel `/aanmelden` als de inloglink van het portaal gaan door `magMailen()`,
  die telt per plek en per uur (en met een hash van het ip, niet het ip).
  Een rem per adres was hier nutteloos geweest: dan typ je gewoon steeds een
  ander adres.
- **Command injection: niet mogelijk.** Geen enkele `shell: true`, geen
  samengestelde opdrachtregel. Alles gaat via `execFileSync` met een array,
  en `npx`/`npm` worden aangeroepen via `process.execPath`.
- **Bestandsuploads: die zijn er niet.** Er is geen enkel endpoint dat een
  bestand aanneemt.
- **Foutmeldingen lekken niets.** De globale `catch` logt alleen
  `e.message` en antwoordt met `{ fout: 'ging-mis' }` en een 500. Geen
  stacktrace, geen padnamen, geen queries.
- **Het koopgeheim wordt in constante tijd vergeleken**, dus niet af te tasten.
