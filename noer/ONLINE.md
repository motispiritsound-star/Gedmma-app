# Zo goedkoop en zo snel mogelijk online

Er zijn twee momenten, en je hoeft ze niet tegelijk te doen.

| | Wat het is | Wat het kost | Hoe lang |
|---|---|---|---|
| **1. Gratis online** | de app staat er, iedereen kan hem gebruiken | € 0, of ± € 10 per jaar met een eigen domein | een kwartier |
| **2. Betaald** | abonnementen, € 6,99 per maand | ± € 5 per maand + eenmalig ± € 80 | één tot twee weken |

De volgorde is niet toevallig. Het duurdere en langzamere deel — KvK, Mollie,
een server — heb je pas nodig als er iemand wil betalen. En of dat zo is, weet
je pas als er mensen zijn die je app gebruiken.

---

## 1. Gratis online, vandaag

```bash
cd noer
npm test                    # eerst de controles
node tools/statisch.js      # -> uit/
```

Dat maakt de **open uitgave**: de site en de app, met alles open. Geen server,
geen account, geen betaling, geen slot. Wat je krijgt is een map met bestanden.

Dan, in de browser:

1. Ga naar **https://app.netlify.com/drop**.
2. Sleep de map `uit` op de pagina.
3. Klaar. Je krijgt een adres als `noer-abc123.netlify.app` dat meteen werkt.

Dat is het. Geen account nodig om te beginnen (wel om het adres te behouden),
geen creditcard, geen configuratie. De gratis laag van Netlify is ruim genoeg
voor de eerste duizenden bezoekers.

**Cloudflare Pages** doet hetzelfde en heeft geen limiet op verkeer, maar wil
wel eerst een account en een koppeling met GitHub of de `wrangler`-opdracht.
Iets meer werk, iets minder zorgen later. Beide zijn gratis; kies wat je op
dat moment het snelst af krijgt.

### Een eigen domein

`noer-abc123.netlify.app` werkt, maar `noer.nl` deel je makkelijker. Een
`.nl`-domein kost bij de meeste registrars vijf tot vijftien euro per jaar —
kijk bij TransIP, Versio of Namecheap. Je koppelt het in het paneel van je host
onder "custom domain"; het certificaat voor https regelt die zelf en gratis.

Doe dit meteen als je het adres gaat delen. Van adres wisselen nadat mensen hem
op hun beginscherm hebben gezet, kost je die mensen.

### Wat je hiervoor níet nodig hebt

Geen KvK, geen btw-nummer, geen zakelijke rekening, geen Mollie, geen server,
geen boekhouder. Je geeft iets weg; dat mag zonder papieren.

Wat je wél moet doen vóór je het adres deelt:

- **Vul de gele plekken in.** Op `privacy.html` en `voorwaarden.html` van de
  open uitgave staat je naam, je plaats en een datum. Zoek op `invullen`.
- **Vervang `noer@voorbeeld.nl`** door een adres dat je leest:
  `sed -i 's/noer@voorbeeld\.nl/jouwadres/g' landing/*.html landing/open/*.html`
- **Vul `houder` en `contact` in `public/js/versie.js`.** Die staan in het
  colofon dat een ouder ziet.
- **Laat de Koran-tekst nalezen.** Dit gaat niet weg omdat het gratis is. Start
  desnoods in je eigen kring terwijl de controle loopt, maar zet het niet in
  een groep van vierhonderd voordat iemand ernaar gekeken heeft.

### Een nieuwe versie neerzetten

```bash
node tools/statisch.js
```

en de map opnieuw slepen. Hoog bij een echte wijziging ook `APP` op in
`public/sw.js` (`noer-app-v7` → `v8`), anders blijven mensen de oude versie
zien; dat is precies waar een service worker voor is.

---

## 2. Betaald, over één tot twee weken

Wat er dan bij komt, in de volgorde waarin je het regelt:

1. **KvK.** Online aanmelden, een afspraak maken, langsgaan met je paspoort.
   Eenmalig ongeveer € 80. Je krijgt je nummer meteen. Een eenmanszaak is
   genoeg; een bv heeft hier geen enkel voordeel.
2. **Een zakelijke rekening.** Kan bij je eigen bank of bij een van de
   goedkopere partijen; reken op nul tot tien euro per maand.
3. **Mollie.** Aanmelden met je KvK-nummer, iDEAL en creditcard aanzetten, en
   vooral **automatische incasso (SEPA direct debit)** — dat is wat een
   abonnement mogelijk maakt. De controle duurt meestal één tot drie werkdagen.
   Geen abonnementskosten; je betaalt per transactie (grofweg € 0,29 voor een
   iDEAL-betaling en € 0,25 voor een incasso — kijk de actuele tarieven na).
4. **Een server.** Eén klein Linux-machientje. Hetzner rekent ongeveer € 4 per
   maand, TransIP en anderen zitten rond € 5. Meer heb je niet nodig: de
   server is één Node-proces zonder afhankelijkheden en de gegevens passen in
   één bestand.
5. **Een maildienst.** Resend heeft een gratis laag die ruim genoeg is voor de
   eerste honderden klanten. Dit is geen luxe: wie online een abonnement
   afsluit, hoort een bevestiging te krijgen die hij kan bewaren.
6. **De voorwaarden en de privacyverklaring** van de betaalde uitgave
   (`landing/voorwaarden.html` en `landing/privacy.html`) invullen en één keer
   laten nalezen.

Alles bij elkaar: **eenmalig ± € 80, daarna ± € 5 per maand.** Eén abonnee
betaalt de server. Bij vijftig abonnees houd je er ruim € 270 per maand aan
over. De rekensom staat in `LANCEREN.md`, de handleiding in `BETALEN.md`.

### De knop omzetten

Als het zover is:

1. Zet in `public/js/versie.js` `modus` op `'abonnement'`.
2. Zet de server neer (systemd en Caddy staan uitgeschreven in `BETALEN.md`).
3. Oefen eerst droog: `NOER_PROEF=1 NOER_GEHEIM=… npm start`, en dan
   `node test/koopweg.js`. Daarna hetzelfde nog eens met een **testsleutel**
   van Mollie, zodat je de webhook één keer echt ziet binnenkomen.
4. Pas dan de live-sleutel.

Iedereen die er al is, houdt zijn app: de voortgang staat op zijn eigen
apparaat en gaat nergens heen. Wat er verandert is dat de lessen 3 tot en met
10, de meeste soera's, de woordthema's en de studio achter het slot komen. Dat
hoor je ruim van tevoren te melden, en dat staat ook zo in de open uitgave op
de startpagina: *"wie er nu bij is, hoort dat ruim van tevoren."*

---

## Wat ik zou doen

**Deze week gratis online met een eigen domein.** Vijftien minuten werk en tien
euro. Deel hem in je eigen kring en bij twee of drie weekendscholen, met de
flyer erbij — die zegt in de open uitgave "nu gratis", en dat is een veel beter
gesprek dan een prijs.

**Ondertussen KvK en Mollie regelen.** Dat loopt op zijn eigen tempo en kost je
nauwelijks aandacht.

**En kijk dan naar wat er gebeurd is.** Komen kinderen terug zonder dat iemand
erbij zit? Vraagt een school of ze het mogen houden? Dan zet je de knop om, en
weet je bovendien wat je precies verkoopt. Gebeurt er niets — dan heb je tien
euro uitgegeven in plaats van een maand werk aan een betaalmuur voor een app
waar niemand op terugkwam.
