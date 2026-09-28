# De mail instellen bij Brevo

Dit is het laatste stuk van de koopketen. Een koper betaalt, de bestelling
komt binnen, en dan moet er een mail met zijn sleutel de deur uit. Gaat dát
niet, dan werkt alles behalve het enige dat hij gekocht heeft.

Reken op een half uur, waarvan het grootste deel wachten is op een
bevestigingsmail en op DNS.

## Waarom niet gewoon vanuit Cloudflare

Cloudflare kan mail **ontvangen** en doorsturen — dat heet Email Routing, en
daar draait `info@darijaforkids.eu` waarschijnlijk al op. Maar **versturen naar
willekeurige mensen kan er niet.** De verzendfunctie voor Workers mag alleen
naar adressen die je van tevoren op je eigen account hebt bevestigd, en dat is
precies wat een winkel niet kan: je weet niet wie er morgen koopt.

Daarom een aparte partij. Cloudflare speelt hieronder nog wel een rol, maar
als DNS-beheerder en niet als postbode: stap 3 zet drie regels in het
Cloudflare-dashboard.

De keuze viel op Brevo omdat het een Frans bedrijf is — de adressen van je
kopers blijven in de EU, en de verwerkersovereenkomst is er een die je als
Europese uitgever ook echt kunt tekenen. Wil je later een ander: `src/mail.ts`
is het enige bestand dat weet wie de post bezorgt.

## Stap 1 — Een account

Ga naar **brevo.com** en maak een account met `info@darijaforkids.eu`.

Bij het aanmelden vraagt Brevo waarvoor je het gebruikt. Kies iets in de
richting van *transactional email* of *e-mails via de API*; nieuwsbrieven zijn
hier bijzaak.

Het gratis plan mag **300 mails per dag**. Dat is ruim voor een koopmail per
verkoop en een inloglink af en toe. Waar het knelt is de weekmail zodra de
lijst groeit — dan zit je er op maandagochtend in één keer overheen.

Je hebt niets te kiezen en niets te betalen: je zít op het gratis plan. Kijk
op het beginscherm rechts onder *Your plan usage*; daar staat "300 left out of
300". De knop *Upgrade now* rechtsboven is een verkoopknop, geen stap.

**Eerst je telefoonnummer bevestigen.** Bovenin staat een balk: *You'll need
to verify your phone before sending your first campaign or messages*. Klik op
*Verify now*. Zonder die stap verstuurt Brevo niets, hoe goed de rest ook
staat — en dat is geen melding die je in de foutcode terugziet.

De rest van het linkermenu — CRM, Marketing, Automations, Conversations,
Commerce — kun je negeren. Dat is voor nieuwsbrieven en verkooppraatjes. Jij
hebt alleen **Transactional** nodig.

## Stap 2 — Het afzenderadres bevestigen

Zoek in het menu naar **Senders** (meestal onder *Senders, Domains &
Dedicated IPs*).

Voeg toe: **`info@darijaforkids.eu`**, met als naam **Darijaforkids**.

Brevo stuurt daar een mail heen met een bevestigingslink. Klik die aan. Zonder
die stap weigert Brevo elke mail namens dat adres — dat is de tweede horde na
de sleutel, en hij komt pas boven water bij je eerste verkoop.

> Het adres moet exact hetzelfde zijn als `AFZENDER_EMAIL` in
> `server/wrangler.toml`. Een test bewaakt dat die gelijk blijft aan het
> contactadres in `src/content/operator.ts`.

## Stap 3 — Het domein echt van jou maken

Stap 2 is genoeg om te *mogen* versturen. Stap 3 bepaalt of je mail
**aankomt** of in de spammap valt.

Zoek bij Brevo naar **Domains** en voeg `darijaforkids.eu` toe. Brevo geeft je
dan een handvol DNS-regels: een **DKIM**-sleutel, een regel voor **SPF**, en
meestal een controleregel.

Die zet je in Cloudflare: **dash.cloudflare.com** → `darijaforkids.eu` → **DNS
→ Records**. Neem ze letterlijk over zoals Brevo ze geeft.

Twee dingen die hier misgaan:

- **Zet de proxy uit** (het wolkje grijs, niet oranje) voor deze regels. Het
  zijn TXT- en CNAME-regels voor mail, en die horen niet door Cloudflare
  omgeleid te worden.
- **Eén SPF-regel per domein.** Staat er al een `v=spf1`, maak er dan geen
  tweede bij maar vul de bestaande aan met wat Brevo vraagt. Twee SPF-regels
  is hetzelfde als geen.

Daarna bij Brevo op *verify* drukken. Soms werkt het meteen, soms duurt het
een uur — DNS heeft zijn eigen tempo.

Overweeg ook een **DMARC**-regel, als die er nog niet is. Begin mild:

```
Naam:  _dmarc
Type:  TXT
Waarde: v=DMARC1; p=none; rua=mailto:info@darijaforkids.eu
```

`p=none` verandert niets aan wat er met je mail gebeurt; het vraagt alleen om
rapportage. Zo zie je een maand lang wat er namens jouw domein wordt verstuurd
voordat je strenger wordt.

## Stap 4 — De sleutel

Bij Brevo onder **SMTP & API → API keys**: maak er een aan. Niet het SMTP-
tabblad ernaast — een Worker kan geen SMTP praten en gebruikt de web-API.

Noem hem `darijaforkids-worker`, zodat je over een half jaar nog weet waar hij
hoort. Hij begint met `xkeysib-` en je ziet hem **één keer**.

Twee dingen over de houdbaarheid, en allebei eindigen ze op dezelfde manier —
een winkel die op een dinsdag stopt met werken zonder dat er iets verandert:

- **De vervaldatum.** Staat er *No expiry* in het menu, kies die. Kun je alleen
  een jaar kiezen, zet dan nu een herinnering voor een week vóór die datum.
- **Negentig dagen stilte.** Er staat klein bij: *API keys also expire after 90
  days of inactivity, regardless of the set expiry date.* Verkoop je een
  kwartaal lang niets en staat de weekmail stil, dan sterft de sleutel vanzelf.
  De eerste koper daarna krijgt geen sleutel, en jij krijgt een 401 waarvan je
  denkt dat je hem al had opgelost.

Merk je dat: `npm run mailsleutel` opnieuw, met een verse sleutel. Verder
verandert er niets.

Dan, vanuit je eigen computer:

```
npm run mailsleutel
```

Die vraagt erom, en de sleutel komt niet in beeld — je kunt er dus geen
schermafdruk van maken. Vervolgens doet hij drie dingen:

1. hij vraagt Brevo of de sleutel werkt, en slaat niets op als dat niet zo is;
2. hij kijkt of `info@darijaforkids.eu` daar als afzender bevestigd is;
3. pas dan zet hij hem bij Cloudflare.

Een geheim werkt meteen — je hoeft de worker niet opnieuw uit te rollen.

## Stap 5 — Nakijken

```
npm run proefkoop
```

Dat speelt een aankoop na zonder te betalen. Er hoort binnen een minuut een
mail met een sleutel te liggen. Kijk ook even in je spammap: ligt hij dáár,
dan is stap 3 nog niet rond.

Gaat het mis, dan zegt de opdracht nu wat Brevo antwoordde:

| Wat er staat | Wat het is |
|---|---|
| `401 Key not found` | de sleutel klopt niet, of is half geplakt |
| iets met `sender` | stap 2 is niet af: het adres is niet bevestigd |
| komt aan in spam | stap 3 is niet af: geen DKIM of SPF op het domein |

## Wat je daarna in de gaten houdt

**De dagelijkse ruimte.** Driehonderd per dag klinkt veel tot de weekmail
groeit. Loopt hij vol, dan valt niet alleen die weekmail om maar ook de
koopmail van iemand die net betaald heeft. Zit je richting de honderd leden,
kijk dan naar een betaald plan — of stuur de weekmail gespreid.

**De reputatie van je afzender.** In de worker zit een rem van twaalf mails
per uur per plek, juist hiervoor: zonder die rem kan een vreemde het portaal
gebruiken om onbeperkt post onder jouw naam te versturen. De ontvangers melden
die aan als spam, en daarna komt de inloglink van iemand die wél betaald heeft
ook niet meer aan.
