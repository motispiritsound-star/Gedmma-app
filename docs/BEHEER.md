# Het beheeroverzicht

Alle aanmeldingen op één pagina, met per openstaande klus de vakmensen die hem
zouden kunnen doen en een mail die al geschreven is. Te vinden op
**https://buurklus.nl/beheer**.

De pagina staat achter Cloudflare Access. Zolang Access niet is ingesteld,
geeft de pagina bewust een foutmelding in plaats van zichzelf: een
beheerpagina die openstaat op het moment dat iemand vergeet hem te beveiligen,
is precies de pagina die niet open mag staan.

## Eenmalig instellen (ongeveer tien minuten)

1. **Cloudflare-dashboard → Zero Trust.** De eerste keer vraagt Cloudflare om
   een teamnaam te kiezen, bijvoorbeeld `buurklus`. Die naam heb je zo nodig.
   Kies het gratis plan; betaalgegevens worden gevraagd maar er wordt niets
   afgeschreven.
2. **Access → Applications → Add an application → Self-hosted.**
   - *Application name*: `Buurklus beheer`
   - *Session duration*: 24 uur is prettig werken.
   - *Public hostname*: domein `buurklus.nl`, pad `beheer`.
3. **Policy toevoegen.**
   - *Policy name*: `Alleen ik`
   - *Action*: Allow
   - *Include* → *Emails* → jouw e-mailadres. Wil je later iemand toelaten, dan
     zet je diens adres erbij; er hoeft niets in de code te veranderen.
4. **Application opslaan**, de applicatie weer openen en de **Application
   Audience (AUD) Tag** kopiëren — een lange reeks tekens.
5. **Compute (Workers) → buurklus-site → Settings → Variables and Secrets.**
   Voeg twee variabelen toe voor Production:
   - `ACCESS_TEAM_DOMAIN` = je teamnaam, dus `buurklus` (niet de hele URL)
   - `ACCESS_AUD` = de AUD-tag uit stap 4
6. **Opnieuw uitrollen** (Deployments → Retry deployment, of gewoon iets pushen).

Daarna: open https://buurklus.nl/beheer. Cloudflare vraagt je e-mailadres,
mailt je een code, en daarna zie je de pagina. Uitloggen kan met de link
rechtsboven.

Werkt het niet, dan zegt de pagina welk van de twee het is: *"Beheer is niet
ingeschakeld"* betekent dat de variabelen uit stap 5 ontbreken; *"Geen
toegang"* betekent dat Access je wel binnenliet maar de instellingen niet
kloppen — vrijwel altijd een AUD-tag van een andere applicatie.

## Hoe je het gebruikt

Bovenaan staan vier getallen: openstaande aanvragen, klanten, vakmensen en
onbeantwoorde berichten. Daaronder de klussen die op iemand wachten, de
nieuwste eerst.

Per klus zie je wat er moet gebeuren, in welke gemeente, en welke vakmensen
daarbij passen — eerst wie binnen 25 kilometer zit, de rest achter *"verder
weg"*. Daaronder staan drie knoppen:

- **Mail N vakmensen** opent je eigen mailprogramma met de vakmensen in de bcc
  (zij zien elkaars adres dus niet), een onderwerp en een tekst. De mail bevat
  de klus, het vakgebied en de gemeente — niet de naam, het adres of het
  telefoonnummer van de klant. Die krijgt alleen de vakman die de klant kiest.
  Lezen, eventueel aanpassen, versturen.
- **Mail de klant** doet hetzelfde richting de klant, met een andere tekst
  naargelang er wel of geen vakmensen gevonden zijn.
- **Afgehandeld** haalt de klus uit de lijst. Meldt dezelfde klant zich later
  opnieuw, dan staat hij er weer bij: een nieuwe aanmelding is een nieuwe vraag.

Passen er meer dan 25 vakmensen in één mail, dan stopt de knop bij 25 en zegt
dat erbij. Langere mailto-links worden door sommige mailprogramma's afgekapt,
en een afgekapte bcc laat stilletjes de laatste adressen vallen.

De tabel eronder toont alle vakmensen, met per vakman op hoeveel openstaande
klussen hij past. Onderaan staan de berichten uit het contactformulier;
*Beantwoorden* opent een antwoord met het oorspronkelijke bericht eronder.

## Waarom je zelf op verzenden drukt

Cloudflare mag alleen mailen naar een adres dat je zelf hebt geverifieerd, dus
naar jou. Automatisch mailen naar vakmensen en klanten vraagt een maildienst
(Resend, Postmark) op jouw naam, met een paar DNS-regels erbij.

Dat kan later, en het is verstandig om het pas te doen als de eerste tientallen
introducties hebben laten zien wat er in die mail hoort te staan. De teksten
staan in `worker/admin.ts` (`proInviteMail` en `customerUpdateMail`); als ze
kloppen, is de stap naar automatisch versturen klein.

## Wat er in de database bij komt

`migrations/0002_job_note_and_handled.sql` voegt twee kolommen toe aan
`signups`: `job_note` (wat de klant zelf schrijft) en `handled_at` (wanneer het
is afgehandeld). Toepassen met:

```sh
npx wrangler d1 migrations apply buurklus --remote
```

Zonder die migratie geeft de pagina een serverfout: de kolommen bestaan dan
niet.
