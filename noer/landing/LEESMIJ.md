# De landingspagina

`index.html` is de pagina waar een ouder terechtkomt vóór hij de app opent: wat
het is, hoe je begint, wat het kost, en de vragen die je krijgt als je geld
vraagt voor iets religieus. Hij is los van de app gebouwd — geen modules, geen
buildstap, één bestand plus een map met schermafdrukken.

De vormgeving komt uit dezelfde tokens als de app (`light-dark()`, hetzelfde
stermotief als masker, dezelfde iconen), zodat het klikken van de pagina naar de
app niet voelt als een overstap naar iets anders.

## Wat je moet aanpassen vóór je hem online zet

1. **Het e-mailadres.** Overal staat nu `noer@voorbeeld.nl` — in de
   wachtlijstknoppen, bij de schoollicentie, en in de voettekst. Vervang alle
   voorkomens:

   ```bash
   sed -i 's/noer@voorbeeld\.nl/jouwadres@jouwdomein.nl/g' landing/index.html
   ```

2. **De prijs, als je hem verandert.** Zoek op `6,99` — dat staat één keer, in
   het prijsblok. Tussen het euroteken en het bedrag staat een vaste spatie
   (U+00A0, geen gewone spatie), zodat "€ 6,99" nooit over twee regels breekt.
   Neem die mee als je het bedrag overtypt. Hetzelfde geldt voor de € 59 per
   jaar en de € 295 voor scholen.

3. **Waar de knoppen naartoe gaan.** Elke knop wijst nu naar `#aanmelden`, de
   wachtlijst onderaan. Dat klopt zolang de app nog niet open is. Gaat hij
   open, vervang die verwijzingen dan door het adres van de app zelf en verander
   het opschrift van "Hou me op de hoogte" in iets als "Begin vandaag".

4. **De titel en de omschrijving voor sociale media.** Bovenin staan
   `og:title`, `og:description` en `og:image`. Dat laatste wijst naar
   `beelden/deelbeeld.png`. Maak daar een volledig adres van
   (`https://jouwdomein.nl/beelden/deelbeeld.png`) zodra je het domein weet:
   sociale media halen dat beeld zelf op en volgen geen relatief pad.

## Een mailadres is niet hetzelfde als een wachtlijst

De wachtlijstknoppen openen het mailprogramma van de bezoeker. Dat werkt, kost
niets, en je hoeft niemands gegevens ergens anders neer te zetten — maar op een
telefoon zonder ingesteld mailaccount gebeurt er niets, en je krijgt geen lijst
die je later in één keer kunt aanschrijven.

Wil je een echt formulier, dan vervang je in de sectie `#wachtlijst` de twee
`mailto:`-knoppen door een `<form>` van een dienst die het adres voor je bewaart
(Buttondown, MailerLite, Laposta — die laatste zit in Nederland). Twee dingen om
dan te regelen: zet er een vinkje bij met waarvoor iemand zich aanmeldt, en zorg
dat de dienst een verwerkersovereenkomst aanbiedt. Een e-mailadres is een
persoonsgegeven, ook als het er maar één is.

## Neerzetten

Het is een statische pagina, en hij staat op zichzelf: alles waar hij naar
wijst — de schermafdrukken, het pictogram, het deelbeeld — staat in `beelden/`.
Kopieer `index.html` en `beelden/` naar waar je hem wilt hebben:

```
jouwdomein.nl/            -> landing/index.html
jouwdomein.nl/beelden/    -> landing/beelden/
jouwdomein.nl/app/        -> public/
```

Dan wijst de knop naar `/app/`. De app werkt op elk pad, ook op een submap; dat
staat in `GO-LIVE.md`, samen met de instellingen die de server nodig heeft.

## Eén bestand om te mailen

```bash
node tools/landing-bundel.js
```

Dat schrijft `landing/noer-landing.html`: dezelfde pagina met alle
schermafdrukken als data-url erin, ongeveer 2,6 MB. Handig om iemand te laten
meekijken zonder iets online te zetten. Met `--fragment` krijg je hetzelfde
zonder `<html>` en `<head>`, om ergens in te bedden; met `--uit` kies je het
pad. De gebundelde bestanden staan in `.gitignore` — ze zijn afgeleid.

## De schermafdrukken vernieuwen

```bash
npm start                        # in een ander venster
node tools/landing-beelden.js
```

Dat loopt de app door in een echte browser met het voorbeeldprofiel erin, en
schrijft de zeven beelden opnieuw naar `beelden/`. Telefoonformaat (390×844) op
tweevoudige schaal, want ze staan op de pagina in een telefoonlijstje. Verander
je iets aan de app, draai dit dan opnieuw: een landingspagina met verouderde
schermafdrukken is erger dan een pagina zonder.

Staat de browser ergens anders dan waar Playwright hem zelf neerzet, geef dat
pad dan mee: `NOER_BROWSER=/pad/naar/chromium node tools/landing-beelden.js`.

## Wat de pagina belooft

Twee zinnen die je waar moet maken en die dus niet los van de app mogen gaan
leven:

- **"Er gaat niets naar een server."** Dat klopt zolang de app is wat hij nu is.
  Zodra er accounts en betalingen zijn, klopt het niet meer, en moet die tekst
  mee veranderen — op de pagina én in het colofon in de app. Zie `LANCEREN.md`.
- **"Maandelijks opzegbaar."** Dat betekent dat er een opzegknop moet zijn die
  net zo makkelijk te vinden is als de aanmeldknop. Dat is in Nederland geen
  nette gewoonte maar een eis.

De sectie **"Wat er níet in zit"** — geen reclame, geen chat, geen ranglijst,
geen meldingen — is er niet om ruimte te vullen. Het is precies waar een ouder
op let, en het is het makkelijkst te controleren wat je zegt.
