# Betalen: van "de app werkt" naar "er staat geld op de rekening"

Dit gaat over de kant van Noer die geld aanneemt: wat je moet regelen, wat je
moet instellen, hoe je het droog kunt oefenen, en wat er nog niet is.

`LANCEREN.md` gaat over de keuzes eromheen — welk model, wat het oplevert, wat
de wet ervan vindt. Dit bestand is de handleiding.

## In het kort

```bash
# droog oefenen: nep-Mollie, nepbank op de site zelf, geen geld
NOER_PROEF=1 NOER_GEHEIM=iets-lang-en-willekeurigs npm start

# echt
NOER_MOLLIE_SLEUTEL=live_… NOER_BASISURL=https://noer.nl \
NOER_GEHEIM=… NOER_MAIL=resend NOER_MAIL_SLEUTEL=re_… node server.js
```

De server zegt bij het starten zelf wat er nog ontbreekt.

## Wat je nodig hebt voordat er geld kan binnenkomen

1. **Een inschrijving bij de KvK.** Een eenmanszaak volstaat. Zonder
   KvK-nummer opent Mollie geen zakelijk account.
2. **Een zakelijke rekening.** Mollie stort daarop uit.
3. **Een Mollie-account**, met iDEAL en creditcard aangezet, en
   **automatische incasso (SEPA direct debit)** — dat laatste is wat een
   abonnement mogelijk maakt. Reken op een paar werkdagen voor de controle.
4. **Een domein met https.** Mollie roept je webhook aan; dat kan niet naar
   `localhost` en niet over `http`.
5. **Een maildienst.** Zie hieronder; dit is geen luxe.

## De instellingen

Alles komt uit omgevingsvariabelen, zodat er nergens een sleutel in de
repository belandt. Ze staan bij elkaar in `server/instellingen.js`.

| Variabele | Wat het is |
|---|---|
| `NOER_MOLLIE_SLEUTEL` | `test_…` of `live_…` uit je Mollie-dashboard |
| `NOER_BASISURL` | `https://noer.nl` — waar de site staat |
| `NOER_GEHEIM` | lange willekeurige tekst; ondertekent de sessiekoekjes |
| `NOER_DATA` | map voor de gegevens (standaard `./gegevens`) |
| `NOER_MAIL` | `resend` of `postmark`; leeg = mail alleen in de log |
| `NOER_MAIL_SLEUTEL` | de sleutel van die dienst |
| `NOER_MAIL_VAN` | `Noer <noer@jouwdomein.nl>` |
| `PORT` | standaard 5173 |
| `NOER_PROEF` | `1` = nep-Mollie, om droog te oefenen |

Een geheim maak je zo:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Verander je dat geheim, dan zijn alle sessies ongeldig en moet iedereen
opnieuw inloggen. Meer gebeurt er niet — wachtwoorden hangen er niet aan vast.

## Droog oefenen

```bash
NOER_PROEF=1 NOER_GEHEIM=proefgeheim npm start
```

In deze stand is Mollie nagebootst en staat er een **nepbank op de site zelf**
(`/proef-betalen.html`) met een knop voor "het lukt" en een voor "het mislukt".
Je kunt de hele weg aflopen: aanmelden, afrekenen, terugkomen op de
bedanktpagina, zien dat de app opengaat, opzeggen, hervatten. Er verschuift
geen geld en er gaat geen mail de deur uit — die komt in de log te staan.

Dezelfde weg staat als test:

```bash
node test/koopweg.js       # twaalf stappen in een echte browser
npm test                   # de betaallogica, met een nep-Mollie
```

Daarna hetzelfde nog eens met een **testsleutel** van Mollie
(`NOER_MOLLIE_SLEUTEL=test_…`). Dan loopt alles langs de echte Mollie, met
testbetalingen die je zelf op "betaald" of "mislukt" zet. Doe dat vóór je een
live-sleutel invult; het is het enige moment waarop je de webhook echt kunt
zien binnenkomen.

## Hoe het abonnement werkt

Dit is de volgorde die Mollie voorschrijft. Hij is niet in te korten.

```
ouder                    Noer                         Mollie
  |  aanmelden.html       |                              |
  |---------------------->| account aanmaken             |
  |                       |----------------------------->| klant (cst_…)
  |                       |  eerste betaling, 'first'    |
  |                       |----------------------------->| betaling (tr_…)
  |<-- naar de bank ------|<-- betaal-adres -------------|
  |  betaalt bij de bank  |                              |
  |                       |<-- webhook: id=tr_… ---------|
  |                       |--- "en wat is de stand?" --->|
  |                       |<-- 'paid' + mandaat ---------|
  |                       |  betaald tot = +1 maand      |
  |                       |--- abonnement aanmaken ----->| sub_…
  |<-- bedankt.html ------|                              |
  |                       |                              |
  |         een maand later                              |
  |                       |<-- webhook: incasso ---------| int het zelf
  |                       |  betaald tot = +1 maand      |
```

Drie dingen die daarin belangrijk zijn:

- **De stand komt altijd van Mollie.** De webhook stuurt alleen een id; de
  server vraagt zelf op wat de stand is. Een verzonnen webhook levert dus
  niets op.
- **Dezelfde webhook mag twee keer binnenkomen** — dat gebeurt ook. De tweede
  keer verandert er niets; er zit een test op.
- **Het abonnement wordt pas aangemaakt ná de eerste betaling**, want pas dan
  is er een machtiging. Lukt dat aanmaken niet, dan houdt de ouder zijn maand
  en komt er een regel in de log. Kijk daar af en toe naar.

De webhook antwoordt altijd met 200, ook als er iets misgaat. Een foutcode
laat Mollie het urenlang blijven proberen, en dat lost niets op.

## Opzeggen

Eén knop in `account.html`, zonder termijn en zonder mailtje. Bij Mollie stopt
de incasso meteen; de toegang loopt door tot het eind van de betaalde periode.
Binnen die periode weer aanzetten kost niets.

Dat de opzegknop even makkelijk te vinden moet zijn als de aanmeldknop is
sinds 2022 wet (de "opzegknop" uit de Wet oneerlijke handelspraktijken). Houd
dat zo als je de pagina verbouwt.

## E-mail

Zonder maildienst schrijft de server elke mail in de log en gaat door. Dat is
handig bij het bouwen en niet houdbaar zodra je live gaat: wie online een
abonnement afsluit, hoort een bevestiging te krijgen die hij kan bewaren
(artikel 6:230v BW).

Er zit geen mailbibliotheek in. Resend en Postmark hebben allebei een HTTP-api
en Node kan fetch; kies er een en zet twee variabelen. Er gaan drie berichten
uit: een bevestiging na de eerste betaling, een bericht als die betaling
mislukt, en een bevestiging bij opzeggen. Meer niet — geen maandelijkse mail
dat het abonnement nog steeds loopt.

Het afzenderadres moet van een domein zijn dat je zelf hebt, met SPF en DKIM
ingesteld. Anders komt de bevestiging in de spammap terecht, en dan heb je hem
net zo goed niet gestuurd.

## Waar de gegevens staan

Eén bestand: `gegevens/noer.json`. Per account een e-mailadres, een versleuteld
wachtwoord, de stand van het abonnement en een kort lijstje betalingen. Meer
niet: geen namen van kinderen, geen voortgang, geen opnames. Die staan op het
apparaat van de gebruiker.

Bij duizend abonnees is dat bestand nog geen megabyte. Schrijven gaat via een
tijdelijk bestand en een rename, dus een stroomstoring midden in het schrijven
laat geen half bestand achter. Groei je hieruit, dan vervang je `server/opslag.js`
— de rest van de server raakt de opslag alleen via die functies.

**Maak er een back-up van.** Dit bestand is je klantenbestand. Een regel in
cron die het elke nacht ergens anders neerzet is genoeg:

```bash
0 3 * * * cp /var/noer/gegevens/noer.json /var/back-ups/noer-$(date +\%F).json
```

## Neerzetten

Het is één Node-proces zonder afhankelijkheden. Een VPS van vijf euro trekt dit
ruimschoots.

```ini
# /etc/systemd/system/noer.service
[Unit]
Description=Noer
After=network.target

[Service]
Type=simple
User=noer
WorkingDirectory=/var/noer
ExecStart=/usr/bin/node server.js
Restart=always
Environment=PORT=5173
Environment=NOER_BASISURL=https://noer.nl
EnvironmentFile=/etc/noer.env
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/var/noer/gegevens

[Install]
WantedBy=multi-user.target
```

Zet de sleutels in `/etc/noer.env` (`chmod 600`), niet in het service-bestand:
dat is voor iedereen leesbaar.

Ervoor een Caddy voor het certificaat:

```
noer.nl {
    reverse_proxy localhost:5173
}
```

Caddy regelt https vanzelf. Dat is geen luxe: zonder https weigert Mollie je
webhook, werkt de service worker niet, en is een sessiekoekje niet veilig.

## Wat er nog niet is

Eerlijk zijn over de gaten is goedkoper dan er later achter komen.

- **Wachtwoord vergeten.** Er is geen zelfbedieningsknop. Iemand mailt je, jij
  zet het met de hand terug. Bij de eerste honderd klanten is dat te doen;
  daarna wil je het bouwen.
- **Facturen.** Er is een lijst betalingen in het account, maar geen pdf met
  een factuurnummer. Voor consumenten hoeft dat niet; voor een school wel.
  Die stuur je voorlopig met de hand.
- **Aanmaningen.** Mislukt een incasso, dan probeert Mollie het zelf nog een
  paar keer en stopt de toegang daarna vanzelf. Er gaat geen mail uit met "je
  betaling is mislukt, werk je gegevens bij".
- **Een school- of klaslicentie in de software.** De prijs staat op de site,
  maar de afhandeling is een gesprek en een factuur met de hand.
- **Een boekhoudkoppeling.** Exporteren doe je uit het Mollie-dashboard.

## Het slot is een slot, geen kluis

De app draait in de browser en moet offline blijven werken. Daarom staat alle
inhoud in de app zelf, en is het slot een `if` in JavaScript. Wie een
ontwikkelaarsvenster kan openen, komt erlangs.

Dat is een bewuste keuze en geen vergissing. De alternatieven kosten meer dan
ze opleveren: inhoud per les van de server halen breekt het offline werken, en
een kind een inlogscherm voorschotelen breekt de app.

Waar je wél voor betaalt: dat het werkt, op elk apparaat, met updates, met de
opnamestudio, zonder gedoe. Dezelfde afweging maakt elke leer-app die in de
browser draait.

Wil je het steviger, dan is de volgorde:

1. De recitatie-audio achter de login zetten. Dat zijn de dure bestanden en ze
   staan op de server; daar is een echte controle mogelijk.
2. Nieuwe lessen als losse bestanden uitleveren die de server alleen aan
   abonnees geeft, en die de app in zijn cache bewaart. Dan blijft offline
   werken heel voor wat al opgehaald is.
3. Pas daarna: alles serverzijdig. Dat is een andere app.
