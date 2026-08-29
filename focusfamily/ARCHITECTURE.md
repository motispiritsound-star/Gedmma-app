# ARCHITECTURE

> 🇳🇱 Nederlands en 🇬🇧 English. De diagrammen en tabellen zijn gedeeld.

## Overzicht / Overview

```
                    ┌──────────────────────────┐
                    │  packages/domain         │
                    │  regels, geen framework  │
                    │  rules, no framework     │
                    └────────────┬─────────────┘
                                 │ (build → dist)
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼────────┐   ┌─────────▼────────┐   ┌─────────▼────────┐
│ apps/api         │   │ apps/web         │   │ apps/mobile      │
│ Fastify + Zod    │   │ Next.js 15       │   │ Expo + Router    │
│ autorisatie      │◄──┤ server actions   │   │ lokale timer     │
│ audittrail       │   │ cookie-doorgifte │   │ mock-adapter     │
└─────────┬────────┘   └──────────────────┘   └──────────────────┘
          │
┌─────────▼────────┐
│ packages/db      │
│ Prisma           │
│ PostgreSQL       │
└──────────────────┘
```

**Eén regel, één plek.** Elke productieregel — mag deze afspraak ingaan, telt
dit focusmoment, is deze meting toegestaan — staat in `packages/domain` en
nergens anders. De API, de webapp en de mobiele app importeren dezelfde
functie. Er is geen tweede implementatie die uit de pas kan lopen.

**One rule, one place.** Every product rule lives in `packages/domain` and
nowhere else. The API, the web app and the mobile app import the same function;
there is no second implementation that can drift.

---

## packages/domain

Strikt TypeScript, `noUncheckedIndexedAccess` aan, geen afhankelijkheden buiten
Zod. Alles is puur: geen netwerk, geen database, geen `Date.now()` in een
beslissing (de tijd komt altijd als parameter binnen, wat de tests
deterministisch maakt).

| Module | Verantwoordelijkheid / Responsibility |
| --- | --- |
| `errors.ts` | `DomainError` met een stabiele code en een tweetalige sleutel, plus de HTTP-afbeelding die elk transport deelt |
| `time.ts` | Lokale klokwaarden: `MinuteOfDay`, vensters die over middernacht heen lopen, maandag als start van de week |
| `people.ts` | `User`, `Family`, `Membership`, `ChildProfile`, `Device`, leeftijdsbanden, de `Actor` waar elke rechtencheck op werkt |
| `permissions.ts` | `decide()` / `can()` / `assertCan()` en `FORBIDDEN_CAPABILITIES` |
| `consent.ts` | Gelaagde toestemming, kind-instemming vanaf 11, `measurementAllowed()` |
| `measurement.ts` | Herkomst, zekerheidsplafond, `describeSource()`, `UsageSummary` |
| `baseline.ts` | De neutrale eerste week en de onderdrukking van elke nudge |
| `agreements.ts` | Contexten, doelgroepen, `validateAgreement()`, `rulesFor()`, sjablonen |
| `focus.ts` | Roosters, `nextOccurrence()`, gebeurtenislog, `reconcileSession()` |
| `checkins.ts` | Check-ins plus de blokkeerlijsten voor klinische en beschamende taal |
| `goals.ts` | Doelen, bijdragen, vieringskaarten, `momentum()` in plaats van een reeks |
| `weeklyReview.ts` | `buildWeeklyReview()` — een type zonder `score`-veld |
| `recommendations.ts` | `recommendOne()`, de gegevensgrens, de uitgeschakelde AI-interface |
| `billing.ts` | Plannen, functies, `hasFeature()`, `MONETISATION_POLICY` |
| `notifications.ts` | Categorieën, stille uren, `shouldDeliver()` |
| `dataRights.ts` | Export, verwijdering met bedenktijd, audittypes, `NOT_COLLECTED` |
| `adapters/` | De schermtijd-poort en de vier implementaties |
| `i18n/` | Nederlandse en Engelse catalogus, type-gekoppeld aan elkaar |

### Waarom de poort de privacygrens is

`ScreenTimeAdapter` heeft geen methode die een bericht, een URL, een
toetsaanslag, een schermafbeelding of een coördinaat kan teruggeven. Een
toekomstige adapter kan dat dus niet lekken zonder dat bestand te wijzigen — en
dat is precies het reviewmoment dat we willen. Een unittest loopt de
methodenamen van elke adapter langs en faalt op woorden als `message`,
`browsing` of `location`.

`ScreenTimeAdapter` has no method that can return a message, a URL, a
keystroke, a screenshot or a coordinate. A future adapter cannot leak those
through this port without editing that file, which is exactly the review
checkpoint we want; a unit test walks the method names of every adapter and
fails on words like `message`, `browsing` or `location`.

---

## packages/db

Prisma tegen PostgreSQL. Zevenentwintig modellen, één migratie, een seed die het
demogezin opnieuw opbouwt en de bibliotheekinhoud bijwerkt.

Twee dingen die opvallen aan het schema zijn er **niet**: er is geen tabel voor
berichten, browsergeschiedenis, locaties of gebruik per app, en er is nergens
een kolom die de inhoud van een melding bewaart. Het schema is de eerste plek
waar een reviewer de privacybelofte kan controleren.

Wat wel bijzonder is:

- `usage_summaries.minutesByCategory` is JSON met **grove** categorieën
  (social, video, games, creation, school, communication, other). Er is geen
  tijdlijn per minuut en geen naam van een app.
- `focus_session_events.id` wordt door de client gegenereerd, zodat een
  opnieuw verstuurde offline-wachtrij samenvalt in plaats van dubbel te tellen.
- `consent_records` is append-only. Intrekken voegt een rij toe; er wordt nooit
  iets verwijderd, want de geschiedenis is het product.
- `audit_logs.metadata` is expres beperkt tot scalars, zodat er geen vrije tekst
  in de audittrail kan glippen.
- Enumlabels met een punt of een streepje (`8-10`, `measurement.os_verified`)
  worden vertaald in `packages/db/src/enums.ts`; Postgres staat die tekens niet
  toe in een enum.

---

## apps/api

Fastify 5, ESM, Zod op elke body. De API is de **enige** plek waar
autorisatie gebeurt; de webapp en de mobiele app zijn clients zonder eigen
oordeel.

**Beveiliging in lagen:**

| Laag | Wat het doet |
| --- | --- |
| `scrypt` (Node-standaardbibliotheek) | Wachtwoordhash met de parameters in de hash zelf, zodat ze later omhoog kunnen zonder bestaande accounts te breken |
| Sessiecookie | 32 willekeurige bytes; alleen de SHA-256 gaat de database in, dus een databasedump is niet af te spelen als login |
| CSRF | Double submit: de header moet gelijk zijn aan de leesbare cookie, en de hash daarvan moet bij de sessie horen |
| Origin | Een schrijfactie van een niet-toegestane origin wordt geweigerd vóór er iets wordt opgezocht |
| Rate limiting | Tien inlogpogingen per vijf minuten per IP en adres; driehonderd schrijfacties per minuut |
| Headers | `nosniff`, `DENY`, `no-referrer`, `no-store`, en een `permissions-policy` die camera, microfoon en locatie uitzet |
| Audittrail | Elke toestemming, export, verwijdering en abonnementswijziging |

**Foutafhandeling.** Een `DomainError` wordt via `HTTP_STATUS_BY_CODE` naar een
status vertaald, met de tweetalige sleutel én de vertaalde zin in de respons.
`451` betekent bij ons letterlijk "hier ontbreekt toestemming", en `402`
"dit hoort bij een ander plan".

**Route-overzicht:**

```
POST   /auth/register            een ouder maakt een account
POST   /auth/sign-in             identieke respons bij onbekend adres en fout wachtwoord
POST   /auth/sign-out
GET    /auth/me                  wie ben ik, wat mag ik, wat biedt dit product nooit
GET    /capabilities             de openbare weigerlijst
POST   /families                 gezin aanmaken, met de rustige week
GET    /family                   iedereen ziet leden en actieve metingen
POST   /family/invitations       tweede volwassene uitnodigen
POST   /family/children          kind koppelen (8-17), met audit
GET    /consent                  status per onderdeel plus de volledige geschiedenis
POST   /consent                  geven of intrekken; intrekken zet de meting direct uit
PATCH  /measurements             aan/uit, geblokkeerd zonder geldige toestemming
GET    /agreements               met issues en "wat geldt voor mij"
POST   /agreements               concept; tweede afspraak vraagt Premium
POST   /agreements/:id/activate  weigert zonder regel voor volwassenen
POST   /agreements/:id/proposals iedereen mag voorstellen, ook kinderen
GET    /focus/schedules          met eerstvolgende keer en deze week
POST   /focus/sessions           idempotent via clientSessionId
POST   /focus/sessions/:id/sync  offline-verzoening
POST   /checkins                 altijd over jezelf
GET    /checkins/family          aggregaat plus alleen gedeelde notities
GET    /review/week              weekoverzicht en één aanbeveling
GET    /goals  POST /goals/:id/contributions
GET    /education  /education/:slug  /activities
GET    /notifications/preferences  met een live voorbeeld
POST   /billing/checkout /confirm /sponsor-code
POST   /account/export           bundel met "wat we nooit bewaren"
POST   /account/deletion         zeven dagen bedenktijd
GET    /admin/metrics            alleen aantallen, nooit gezinsinhoud
```

---

## apps/web

Next.js 15 met de App Router. Server Components halen data server-side op en
geven de httpOnly-sessiecookie door aan de API; mutaties gaan via Server
Actions. De browser praat dus nooit rechtstreeks met de API, met één
uitzondering: de focustimer synchroniseert via een same-origin route handler
(`/api/focus/[sessionId]/sync`) die het verzoek doorzet. Zo blijft er precies
één origin en is er geen CORS met credentials nodig.

De styling is met de hand geschreven CSS met tokens in `globals.css`. Dat is
een bewuste keuze: contrast, focusringen en het gedrag bij
`prefers-reduced-motion` staan zo op één plek en zijn te lezen zonder een
buildstap te draaien.

Next.js 15 App Router. Server Components fetch server-side and forward the
httpOnly session cookie; mutations go through Server Actions. The browser never
talks to the API directly, except through a same-origin route handler used by
the focus timer — so there is exactly one origin and no credentialed CORS.

---

## apps/mobile

Expo (SDK 57) met expo-router. De app is opzettelijk dun: de schermen die ertoe
doen — de grote focustimer, "wat geldt voor mij", de check-in, het
transparantiescherm — zijn componenten die alle regels uit `@focusfamily/domain`
halen.

`src/native/screenTime.ts` is het enige bestand dat weet of er een native
module bestaat. Beide worden optioneel geladen; ontbreekt er een, dan levert de
fabriek de eerlijke `UnsupportedScreenTimeAdapter` in plaats van te doen alsof.

Metro is ingesteld voor de monorepo: `watchFolders` naar de root en
`nodeModulesPaths` naar beide `node_modules`-mappen.

---

## Gegevensstroom van een focusmoment / Data flow of a focus moment

```
telefoon / phone            server                       database
─────────────────           ──────                       ────────
tik "start"
  → event in wachtrij
  → timer loopt lokaal
      (werkt offline)

  ── POST /focus/sessions ──►  idempotent op clientSessionId
                               ──────────────────────────────► focus_sessions
tik "pauze" + reden
tik "verder"
tik "gelukt"
  → drie events in wachtrij

  ── POST .../sync ────────►  reconcileSession()
                              • dubbele id's vallen samen
                              • events na een einde geweigerd
                              • klok >10 min vooruit teruggezet
                               ──────────────────────────────► focus_session_events
                              ◄── voortgang + wat is toegepast
```

De verzoening zelf staat in het domein en wordt daar getest; de handler slaat
alleen het resultaat op. Dezelfde functie draait in de mobiele app, zodat het
scherm hetzelfde antwoord geeft als de server.

The reconciliation itself lives in the domain package and is tested there; the
handler only persists the result. The same function runs in the mobile app, so
the screen gives the same answer as the server.

---

## Buildvolgorde / Build order

`domain → db → api → web`. De domeinpakket wordt als ESM naar `dist`
gecompileerd en via `exports` geconsumeerd; Next.js zet het door
`transpilePackages`, Metro pikt het op via `watchFolders`.

## Waarom deze grenzen / Why these boundaries

- **Domein zonder framework** betekent dat een regel getest kan worden zonder
  een server te starten. 120 tests draaien in ongeveer honderd milliseconden.
- **Autorisatie alleen in de API** betekent dat een fout in de webapp geen
  toegang kan opleveren; de webapp kan hoogstens een knop tonen die de API
  vervolgens weigert. De e2e-tests controleren precies dat.
- **Een echte database in de tests** vangt de fouten die een nepobject
  verbergt: transacties, unieke sleutels, cascades bij verwijderen.
