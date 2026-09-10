# De site

Dit is alles wat een ouder ziet vóór en naast de app zelf. De server zet deze
map op `/` neer en de app op `/app/`.

| Pagina | Waarvoor |
|---|---|
| `index.html` | het verkooppraatje: wat het is, hoe je begint, wat het kost |
| `aanmelden.html` | account maken, plan kiezen, door naar de bank |
| `inloggen.html` | terugkomen |
| `account.html` | je abonnement, je betalingen, je wachtwoord, de opzegknop |
| `bedankt.html` | waar Mollie je heen stuurt na het betalen |
| `downloaden.html` | Noer op je beginscherm zetten, per apparaat |
| `voorwaarden.html` | de voorwaarden |
| `privacy.html` | de privacyverklaring |
| `niet-gevonden.html` | de 404 |
| `proef-betalen.html` | de nepbank; doet alleen iets met `NOER_PROEF=1` |

De vormgeving staat in `stijl.css` en komt uit dezelfde tokens als de app
(`light-dark()`, hetzelfde stermotief als masker), zodat het klikken van de
site naar de app niet voelt als een overstap naar iets anders. `site.js` bevat
de vier hulpjes die de formulieren nodig hebben.

## Wat je moet aanpassen vóór je hem online zet

1. **Het e-mailadres.** Overal staat nu `noer@voorbeeld.nl`. Vervang alle
   voorkomens, op elke pagina:

   ```bash
   sed -i 's/noer@voorbeeld\.nl/jouwadres@jouwdomein.nl/g' landing/*.html
   ```

   Vergeet `NOER_MAIL_VAN` niet; dat is het adres waarvandaan de bevestiging
   verstuurd wordt.

2. **De prijs, als je hem verandert.** Het bedrag dat Mollie int staat in
   `server/instellingen.js` onder `PLANNEN` — dat is de waarheid. Op de site
   staat hij als tekst op een handvol plekken: zoek op `7,99` en `79`. Tussen
   het euroteken en het bedrag staat soms een vaste spatie (U+00A0), zodat
   "€ 7,99" nooit over twee regels breekt; neem die mee als je overtypt.
   Vergeet de € 295 voor scholen op de flyer niet, en `tools/marketing-sjabloon.html`.
   Er is een test die controleert dat de site en Mollie hetzelfde zeggen.

3. **De gele plekken in `voorwaarden.html` en `privacy.html`.** Alles met
   `class="invullen"` moet ingevuld: bedrijfsnaam, KvK-nummer, btw-nummer,
   adres, de hostingpartij, en de datums. Ze lichten geel op, dus je kunt ze
   niet missen — maar kijk het na met:

   ```bash
   grep -c 'class="invullen"' landing/*.html
   ```

   Laat die twee pagina's daarna één keer nalezen door iemand die dit vaker
   doet. Ze zijn geschreven door de bouwer van de app, niet door een jurist.

4. **De titel en de omschrijving voor sociale media.** Bovenin staan
   `og:title`, `og:description` en `og:image`. Dat laatste wijst naar
   `beelden/deelbeeld.png`. Maak daar een volledig adres van
   (`https://jouwdomein.nl/beelden/deelbeeld.png`) zodra je het domein weet:
   sociale media halen dat beeld zelf op en volgen geen relatief pad.

## Neerzetten

Je zet deze map niet los neer: de server doet dat. `node server.js` serveert
`landing/` op `/`, `public/` op `/app/` en de API op `/api/`. Hoe je dat op een
machine krijgt — systemd, Caddy, back-ups — staat in `BETALEN.md`.

De pagina's zijn wel gewone HTML zonder buildstap. Wil je er een aanpassen, dan
open je het bestand en verandert de tekst; er is niets om te compileren.

## Eén bestand om te mailen

```bash
node tools/landing-bundel.js
```

Dat schrijft `landing/noer-landing.html`: de verkooppagina met alle
schermafdrukken als data-url erin, ongeveer 2,6 MB. Alleen `index.html`; de
andere pagina's hebben een server nodig en hebben los niets te zoeken. Handig om iemand te laten
meekijken zonder iets online te zetten. Met `--fragment` krijg je hetzelfde
zonder `<html>` en `<head>`, om ergens in te bedden; met `--uit` kies je het
pad. De gebundelde bestanden staan in `.gitignore` — ze zijn afgeleid.

## De schermafdrukken vernieuwen

```bash
npm start                        # in een ander venster
node tools/landing-beelden.js
```

Dat loopt de app door in een echte browser met het voorbeeldprofiel erin, en
schrijft de zeven beelden opnieuw naar `beelden/`. De server moet in de
proefstand draaien (`NOER_PROEF=1`): het gereedschap sluit onderweg een
proefabonnement af, anders staat de halve app op slot op je eigen
verkooppagina. Telefoonformaat (390×844) op
tweevoudige schaal, want ze staan op de pagina in een telefoonlijstje. Verander
je iets aan de app, draai dit dan opnieuw: een landingspagina met verouderde
schermafdrukken is erger dan een pagina zonder.

Staat de browser ergens anders dan waar Playwright hem zelf neerzet, geef dat
pad dan mee: `NOER_BROWSER=/pad/naar/chromium node tools/landing-beelden.js`.

## Wat de site belooft

Drie dingen die je waar moet maken, en die dus niet los van de app mogen gaan
leven:

- **"Van je kind gaat er niets naar een server."** Dat klopt nu. Ga je ooit
  voortgang synchroniseren tussen apparaten, dan klopt het niet meer, en moet
  het op drie plekken tegelijk mee veranderen: `privacy.html`, het colofon in
  de app (`#/over`), en het ouderscherm.
- **"Maandelijks opzegbaar, met één knop."** Die knop staat in `account.html`
  en moet even makkelijk te vinden blijven als de aanmeldknop. Dat is in
  Nederland geen nette gewoonte maar een eis.
- **"Het gratis deel blijft open."** Dat is wat `GRATIS` in `server/api.js` en
  in `public/js/toegang.js` zegt. Verruim of versmal je dat, pas dan ook de
  prijskaart op `index.html` aan — daar staat het uitgeschreven.

De sectie **"Wat er níet in zit"** — geen reclame, geen chat, geen ranglijst,
geen meldingen — is er niet om ruimte te vullen. Het is precies waar een ouder
op let, en het is het makkelijkst te controleren wat je zegt.

## Beelden om te delen, en de flyer

In `marketing/` staan vier beelden voor sociale media en de familiegroep, met
`node tools/marketing-beelden.js` opnieuw te maken. `marketing/LEESMIJ.md` zegt
welk formaat waar hoort, en er staan twee berichtjes in die je kunt
doorsturen — een voor een groepsapp en een voor een moskee of weekendschool.

`flyer.html` is één A4 voor dat laatste gesprek: open hem in de browser en sla
hem op als pdf (Ctrl-P, marges op geen, achtergronden aanzetten). Dat hij op
één vel past staat in de test; groeit de tekst, dan valt dat om.

## De koopweg testen

```bash
NOER_PROEF=1 NOER_GEHEIM=proefgeheim npm start   # in een ander venster
node test/koopweg.js
```

Twaalf stappen in een echte browser: van de startpagina naar een account, een
betaling die afbreekt, een die lukt, de app die opengaat, het accountscherm,
opzeggen, hervatten, uitloggen, en de app die weer op slot gaat. Verander je
iets aan deze pagina's, draai dit dan.
