# PRIVACY_MODEL

**Wat we bewaren, wat we weigeren, en waar dat in de code staat**
**What we keep, what we refuse, and where that lives in the code**

---

## Het uitgangspunt / The starting point

Er bestaan apps die berichten, websites en locatie doorsturen naar een ouder.
Wij bouwen dat niet. Niet alleen omdat de AVG er streng in is voor gegevens van
kinderen, maar omdat het meestal het tegenovergestelde oplevert van wat een
ouder zoekt: zodra een kind merkt dat er stiekem wordt meegekeken, verhuist het
gesprek naar een plek waar de ouder niet meekijkt. Het onderwerp verdwijnt niet,
alleen de uitnodiging om erover te praten.

FocusFamily kiest daarom voor **zichtbaarheid boven zicht**: iedereen ziet
dezelfde afspraken en dezelfde metingen, inclusief de kinderen.

There are apps that forward messages, websites and location to a parent. We do
not build that — not only because the GDPR is strict about children's data, but
because it usually produces the opposite of what a parent wants. FocusFamily
chooses **visibility over surveillance**: everyone sees the same agreements and
the same measurements, children included.

---

## De weigerlijst / The refusal list

```ts
// packages/domain/src/permissions.ts
export const FORBIDDEN_CAPABILITIES = Object.freeze([
  'message.read',              'message.metadata.read',
  'browsing.history.read',     'browsing.content.inspect',
  'keystroke.capture',         'screenshot.capture',
  'microphone.capture',        'camera.capture',
  'location.precise.track',    'contacts.read',
  'photos.read',               'remote.device.control',
  'covert.monitoring.enable',  'child.data.sell',
  'child.behavioural.advertising',
] as const);
```

Deze lijst is **niet** een opsomming van dingen die we vergeten zijn te
bouwen. Hij wordt actief afgedwongen:

| Waar | Wat er gebeurt |
| --- | --- |
| `decide()` | Geeft voor elke actor — ook een helpdeskmedewerker — `authz.capability_not_offered` terug. Niet "je mist een rol", maar "dit bestaat niet in dit product". |
| `permissions` | Een unittest controleert dat geen enkele geweigerde mogelijkheid per ongeluk in de toegestane lijst staat. |
| `GET /capabilities` | Openbaar, zonder inloggen. Een auditor — of een nieuwsgierige tiener — kan de claim controleren zonder ons op ons woord te geloven. |
| API-tests | Vragen `/messages/:id`, `/browsing/:id`, `/location/:id`, `/keystrokes/:id` op en verwachten `404`. |
| Adaptertests | Lopen de methodenamen van elke schermtijd-adapter langs en falen op `message`, `browsing`, `keystroke`, `location`, `screenshot`. |
| Routetest | `app.printRoutes()` mag geen pad bevatten dat op die woorden lijkt. |

---

## De vier soorten gegevens / The four kinds of data

Elk getal dat FocusFamily toont draagt zijn herkomst mee, met een **plafond op
de zekerheid** die we mogen claimen.

| Herkomst | Wat het betekent | Maximale zekerheid |
| --- | --- | --- |
| `self_reported` | Iemand heeft het zelf ingetypt | `medium` |
| `app_observed` | De timer van FocusFamily heeft het gezien, binnen deze app | `medium` |
| `os_verified` | Het besturingssysteem meldde het, na toestemming van iedereen | `high` |
| `simulated` | Voorbeeldgegevens uit de mock-adapter | `low` |

`clampConfidence()` zorgt dat een zelfgerapporteerd getal nooit als gemeten kan
worden gepresenteerd, en `weakestSource()` dat een gemengd cijfer niet sterker
oogt dan zijn zwakste ingrediënt.

In het demogezin zijn er **nul** `os_verified`-rijen, omdat geen enkel toestel
in een demo ooit Screen Time-toegang heeft gekregen. Het weekoverzicht zegt dat
letterlijk: *"Geen telefoon heeft iets gemeld."*

---

## Toestemming in lagen / Layered consent

| Leeftijd | Wie moet ja zeggen |
| --- | --- |
| 8–10 | De volwassene. Het kind krijgt wel het uitlegscherm te zien. |
| 11–13 | De volwassene **en** het kind. |
| 14–17 | De volwassene **en** het kind. |
| Volwassen | Alleen jij, over jezelf. |

Wat dat concreet betekent, uit de testsuite:

```
✓ is niet effectief op een ouderlijk ja alleen voor een tiener
✓ wordt effectief zodra de jongere zelf ook ja zegt
✓ stopt onmiddellijk wanneer iemand intrekt, nieuwste record wint
✓ laat een ouder een meting niet aanzetten die een tiener niet heeft goedgekeurd
   → HTTP 451, messageKey: consent.missing_child_assent
```

Een ouder mag namens een kind toestemmen, maar **nooit namens een andere
volwassene**, en nooit voor de instemming die een tiener zelf moet geven.

**De geschiedenis blijft.** `consent_records` is append-only: intrekken voegt
een rij toe. Op `/app/data` staat per beslissing wie hem nam, wanneer, en de
precieze zin die op dat moment op het scherm stond.

**Intrekken werkt meteen.** De route zet in dezelfde handeling de bijbehorende
meting uit en schrijft `disabledAt`. Er is geen tussenperiode waarin nog data
binnenkomt.

---

## Wat we nooit bewaren / What we never store

```ts
// packages/domain/src/dataRights.ts
export const NOT_COLLECTED = Object.freeze([
  'message_content', 'message_metadata',
  'browsing_history', 'browsing_content',
  'keystrokes', 'screenshots',
  'microphone_audio', 'camera_images',
  'precise_location', 'contacts', 'photo_library',
  'per_app_usage_detail',
]);
```

Deze lijst staat **in het exportbestand zelf**. Wie zijn gegevens downloadt
krijgt niet alleen wat we hebben, maar ook een expliciete opsomming van wat we
nooit hadden — zodat "alles over mij" controleerbaar is in plaats van
geïmpliceerd.

Let op `per_app_usage_detail`. Android *kán* voorgrondtijd per pakket geven. We
brengen die op het toestel terug tot zeven grove categorieën en sturen alleen
dat aggregaat door. De pakketlijst verlaat de telefoon niet.

---

## Wat een kind ziet / What a child sees

Dit is de test die het scherpst laat zien waar we staan:

```
✓ laat een kind elke regel lezen die voor wie dan ook geldt, ook voor de ouders
✓ laat een kind geen afspraak laten ingaan
✓ laat een kind wel een wijziging voorstellen
✓ geeft een ouder de privé-notitie van een kind niet
```

Die laatste is bewust. Een check-in is van de persoon die hem invulde. Het
gezinsoverzicht toont gemiddelden en alleen de notities die iemand actief heeft
gedeeld. `GET /checkins/:userId` van iemand anders geeft `403` met
`checkin.private_to_the_author` — een expliciete weigering, geen stilzwijgend
lege lijst, want stilte nodigt uit om te blijven proberen.

---

## De helpdesk / Support staff

`support_admin` is een **platformrol**, geen gezinsrol. Iemand met die rol
heeft geen `Membership` en daarmee geen enkele gezinsrechten:

```
✓ geeft de helpdesk alleen aantallen
✓ laat de helpdesk geen gezinsinhoud openen  (/family, /agreements,
                                              /checkins/family, /review/week)
✓ laat een ouder niet bij het beheerscherm
```

`/admin/metrics` telt gezinnen, volwassenen, kinderen, actieve afspraken,
focusmomenten en abonnementen. Er is geen route in het hele beheerdeel die een
`familyId` als parameter accepteert.

---

## Rechten van betrokkenen / Data subject rights

| Recht | Hoe |
| --- | --- |
| Inzage en overdraagbaarheid | `POST /account/export` levert een JSON-bundel. Iedereen mag zichzelf exporteren; alleen een volwassene mag het hele gezin. |
| Rectificatie | Check-ins en afspraken zijn te bewerken; toestemming is bij te stellen. |
| Verwijdering | `POST /account/deletion` plant het in met **zeven dagen bedenktijd**, te annuleren tot het moment zelf. Daarna is het echt weg: `family.delete` en `user.delete` cascaderen door het hele schema. |
| Bezwaar / intrekken | Elk onderdeel apart uit te zetten, zonder de rest van de app kwijt te raken. |
| Transparantie | `/app/data` per persoon, `/privacy` openbaar, `/capabilities` machineleesbaar. |

Twee tests bewaken de verwijderroute: één controleert dat uitvoeren tijdens de
bedenktijd `409` geeft, één dat het gezin daarna daadwerkelijk uit de database
verdwijnt.

---

## Beveiliging / Security

| Maatregel | Detail |
| --- | --- |
| Wachtwoorden | scrypt (N=16384) uit de Node-standaardbibliotheek; de parameters staan in de hash zodat ze omhoog kunnen zonder accounts te breken |
| Sessies | 32 willekeurige bytes in een httpOnly-cookie; alleen de SHA-256 in de database |
| CSRF | Double submit met een tweede token, gekoppeld aan de sessie |
| Origin | Schrijfacties van een niet-toegestane origin worden geweigerd vóór opzoeken |
| Rate limiting | 10 inlogpogingen per 5 minuten per IP+adres; 300 schrijfacties per minuut |
| Enumeratie | Onbekend adres en fout wachtwoord geven dezelfde status en dezelfde sleutel — getest |
| Headers | `nosniff`, `frame-options: DENY`, `no-referrer`, `no-store`, camera/microfoon/locatie uit via `permissions-policy` |
| Audittrail | Toestemming, export, verwijdering, abonnement, inloggen; metadata alleen scalars, dus geen vrije tekst |

---

## Verdienmodel / Business model

```ts
export const MONETISATION_POLICY = Object.freeze({
  sellsPersonalData: false,
  sellsChildData: false,
  behaviouralAdvertising: false,
  thirdPartyAdSdks: [],
  sponsorSeesFamilyContent: false,
});
```

Deze constante staat op de prijzenpagina *en* in een test, zodat een latere
bijdrager het verdienmodel niet stilletjes kan veranderen.

Een werkgever of school die licenties koopt ziet precies drie velden:
`seatsPurchased`, `seatsRedeemed`, `renewsAt`. Er is geen tabel die een sponsor
aan een gezin koppelt, en de test controleert dat het antwoord op
`/billing/sponsor-code` geen ledeninformatie bevat.

Alles wat met veiligheid en privacy te maken heeft is gratis en blijft gratis:
één afspraak, focusmomenten, check-ins, het weekoverzicht, exporteren,
verwijderen, toestemming intrekken en de bibliotheek. `NEVER_GATED` legt dat
vast en een test controleert dat geen van die onderdelen ooit in een betaald
plan belandt.

---

## Waar we tekortschieten / Where we fall short

Eerlijk zijn hoort ook hier:

- **Geen externe audit.** De beloftes zijn afgedwongen in code en tests. Dat is
  iets anders dan gecertificeerd.
- **Geen versleuteling op veldniveau.** Notities en afspraken staan als tekst in
  PostgreSQL. Voor productie hoort daar op zijn minst schijfversleuteling bij,
  en een aparte sleutel voor de vrije tekst is het overwegen waard.
- **Verwijderen gaat op verzoek, niet via een geplande taak.** De route bestaat
  zodat de demo de hele cyclus kan tonen; een deployment heeft een cron nodig.
- **Rate limiting is per proces.** Bij meerdere instanties hoort er een
  gedeelde limiter voor.
- **De exportbundel wordt in de database bewaard** tot hij vervalt. Dat is
  praktisch voor een demo, maar een productieopzet zet hem in objectopslag met
  een korte, ondertekende URL.
