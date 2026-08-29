# FocusFamily

**Gezamenlijke digitale balans voor gezinnen — Collaborative digital wellbeing for families**

> Nederlands eerst, English below. Elke sectie staat er in beide talen.
> Dutch first, English below. Every section appears in both languages.

---

## 🇳🇱 Wat dit is

FocusFamily helpt gezinnen met kinderen van 8 tot 17 om **samen** afspraken te
maken over schermen, in plaats van dat één ouder regels oplegt en stiekem
meekijkt.

Drie dingen maken het anders dan een klassieke ouderlijk-toezicht-app:

1. **Een afspraak gaat pas in als er minstens één regel voor de volwassenen in
   staat.** Dit is geen aanbeveling in de documentatie maar een controle in de
   code: `validateAgreement()` geeft een fout, de API weigert `activate`, en de
   knop in de app blijft uitgeschakeld.
2. **Bij elk getal staat waar het vandaan komt.** Zelf ingevuld, door de app
   gezien, door de telefoon gemeld of voorbeeldgegevens — met een plafond op de
   zekerheid die we mogen claimen. Wat we niet weten, verzinnen we niet.
3. **Er is geen scherm dat alleen een ouder kan openen.** Kinderen zien
   dezelfde afspraken, dezelfde metingen en dezelfde toestemmingsgeschiedenis.

FocusFamily stelt geen diagnoses, meet geen gezondheid en gebruikt nooit
woorden als "verslaving" of "gefaald". Een test controleert dat: de volledige
tekstcatalogus wordt bij elke run gescand op klinische en beschamende taal.

## 🇬🇧 What this is

FocusFamily helps families with children aged 8–17 make agreements about
screens **together**, instead of one parent imposing rules and watching in
secret.

Three things set it apart from a classic parental-control app:

1. **An agreement cannot come into force unless at least one rule applies to
   the adults.** That is not a recommendation in the docs but a check in the
   code: `validateAgreement()` reports an issue, the API refuses `activate`,
   and the button in the app stays disabled.
2. **Every figure says where it came from.** Self-reported, app-observed,
   OS-verified or simulated — with a ceiling on the confidence we allow
   ourselves to claim. What we do not know, we do not invent.
3. **There is no screen only a parent can open.** Children see the same
   agreements, the same measurements and the same consent history.

FocusFamily makes no diagnoses, measures no health and never uses words like
"addiction" or "failed". A test enforces that: the entire copy catalogue is
scanned for clinical and shaming language on every run.

---

## Snel starten / Quick start

**Nodig / Requirements:** Node 22+, PostgreSQL 14+.

```bash
cd focusfamily
npm install
cp .env.example .env            # pas DATABASE_URL aan / adjust DATABASE_URL

createdb focusfamily
npm run db:generate
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
npm run db:seed                 # demogezin / demo family

npm run build                   # domain -> db -> api -> web
npm run dev:api                 # http://127.0.0.1:4000
npm run dev:web                 # http://localhost:3000
```

**Demo-accounts** (wachtwoord / password: `focusfamily-demo-2026`):

| E-mail | Rol / Role |
| --- | --- |
| `noor@focusfamily.test` | ouder / guardian |
| `sam@focusfamily.test` | tweede ouder / second guardian |
| `lena@focusfamily.test` | 15 jaar / 15 years old |
| `support@focusfamily.test` | helpdesk (alleen aantallen / counts only) |

Tijn (9) heeft een gekoppeld profiel zonder eigen e-mailadres — dat is het
normale geval voor de jongste leeftijdsgroep.
Tijn (9) has a linked profile without an email address of his own, which is the
normal case for the youngest age band.

**Mobiel / mobile:**

```bash
cd apps/mobile
npx expo start          # Expo Go, mock-adapter / mock adapter
npm test                # component tests
npm run typecheck
```

---

## De demo-doorloop / The demo walkthrough

Wat je in de demo daadwerkelijk kunt doen, in volgorde:

1. **Aanmelden en een gezin maken** — `/signin`, of registreer en doorloop
   `/app/onboarding`. De rustige eerste week van zeven dagen staat standaard
   aan.
2. **Transparant instemmen** — `/app/data` toont per persoon welke toestemming
   actief is, met precies de zin die op dat moment op het scherm stond. Probeer
   als Noor de OS-meting voor Lena aan te zetten: dat wordt geweigerd met
   `consent.missing_child_assent` tot Lena zelf ja zegt.
3. **Afspraken maken** — `/app/agreements`. Maak een concept dat alleen voor de
   kinderen geldt en probeer het te laten ingaan; dat lukt niet.
4. **Een focusmoment plannen en doen** — `/app/focus`, dan de grote timer. Zet
   het netwerk uit in je devtools: de timer loopt door, de gebeurtenissen komen
   in een wachtrij en gaan alsnog weg als je weer online bent.
5. **De week terugkijken** — `/app/review`. Geen cijfer, wel gespreksvragen,
   en bij elk getal een herkomstlabel.
6. **Gegevens beheren** — exporteren, toestemmingsgeschiedenis lezen, metingen
   uitzetten, verwijderen plannen en weer annuleren.

The same walkthrough in English: sign in, consent transparently, build an
agreement (and watch it be refused while it only binds the children), run a
focus moment offline, read a week that has no score in it, and manage your
data. Everything works through the mock adapter, with no privileged OS
entitlements.

---

## Wat werkt, wat is nagemaakt, wat is gepland

### ✅ Geïmplementeerd / Implemented

| Onderdeel / Area | Waar / Where |
| --- | --- |
| Domeinregels, volledig getest (120 tests) | `packages/domain` |
| PostgreSQL-datamodel met migratie en seed | `packages/db` |
| Beveiligde API: scrypt, sessiecookies, CSRF, rate limiting, audittrail | `apps/api` |
| Rollen en rechten, inclusief een lijst van geweigerde mogelijkheden | `packages/domain/src/permissions.ts` |
| Gelaagde toestemming met kind-instemming vanaf 11 jaar | `packages/domain/src/consent.ts` |
| Afsprakenbouwer met zes contexten en leeftijdsvarianten | `packages/domain/src/agreements.ts` |
| Focusmomenten, lokale timer en offline-verzoening | `packages/domain/src/focus.ts` |
| Check-ins, weekoverzicht, doelen, vieringskaarten | `packages/domain` |
| Deterministische aanbeveling met bewijsvoering | `packages/domain/src/recommendations.ts` |
| Webapp (Next.js) in Nederlands en Engels | `apps/web` |
| Mobiele app (Expo) met de grote focusschermen | `apps/mobile` |
| Bibliotheek voor ouders: 6 artikelen, 12 activiteiten, beide talen | `packages/db/src/content.ts` |
| Export, verwijderen met bedenktijd, toestemmingsgeschiedenis | `apps/api/src/routes/account.ts` |

### 🔶 Nagemaakt (met opzet) / Mocked (deliberately)

| Onderdeel / Area | Waarom / Why |
| --- | --- |
| `MockScreenTimeAdapter` | Er is geen Apple- of Google-recht in deze omgeving. De adapter labelt alles als `simulated`; het kan nooit als meting doorgaan. |
| `MockBillingProvider` | Stripe draait in testmodus of helemaal niet. De mock doet niet alsof er geld is betaald. |
| Uitnodigingstoken in de respons | In een echte deployment gaat dit per e-mail; hier komt het één keer terug in de API-respons zodat de demo werkt. |
| Push-meldingen | De bezorgbeslissing (`shouldDeliver`) is echt en getest; er is geen APNs/FCM-koppeling. |

### 🕓 Gepland / Planned

- **Native schermtijd-modules.** De interfaces staan er (`IOSScreenTimeAdapter`,
  `AndroidUsageAdapter`); de native kant vraagt om entitlements en een
  development build. Zie `NATIVE_CAPABILITIES.md`.
- **Questly-koppeling.** Er is één inert veld (`questlyRef`) en een
  statusrespons `{ status: 'planned', connected: false }`. Er gaat vandaag
  niets naartoe.
- **AI-assistent.** De interface bestaat (`AiAdvisor`), de grens staat vast
  (`ALLOWED_FACT_KEYS`), de standaardimplementatie is `DisabledAiAdvisor`.
- **Begeleide programma's** en pdf-export van het weekoverzicht zijn wel
  gemodelleerd als entitlement, maar nog niet gebouwd.

---

## Tests

```bash
npm test                 # 186 tests: domein, content, API tegen echte PostgreSQL
npm run test:e2e         # 17 Playwright-journeys tegen de echte stack
npm run test:mobile      # 19 component-tests (jest-expo)
npm run lint             # ESLint, 0 waarschuwingen toegestaan
npm run typecheck        # alle workspaces
npm run build            # productiebuild van web + API
```

De API-tests praten met een **echte** PostgreSQL-database
(`focusfamily_test`), niet met een handgeschreven nepobject: de interessante
fouten in deze codebase zitten in transacties, unieke sleutels en cascades.
De end-to-end-tests starten een productiebuild van Next.js vóór een echte
Fastify-server; er wordt niets gestubd.

The API tests talk to a **real** PostgreSQL database rather than a hand-written
fake, and the end-to-end tests run a production Next.js build in front of a
real Fastify server with nothing stubbed.

**Wat de tests specifiek bewijzen / What the tests specifically prove**

- Toestemming: een ouder alleen is niet genoeg voor een tienermeting; intrekken
  zet de meting direct uit; de geschiedenis blijft staan.
- Rechten: kinderen lezen alles, activeren niets; de helpdesk ziet aantallen en
  nooit gezinsinhoud; een gezin komt niet bij een ander gezin.
- Deelname van volwassenen: elke ingeplande focusmoment in de seed heeft een
  volwassene, en het weekoverzicht meldt dat als gewoon feit.
- Offline: een wachtrij die na een uur vliegtuigmodus binnenkomt telt één keer,
  een tweede upload van dezelfde gebeurtenis telt niet mee, en een telefoonklok
  die in 2031 staat wordt teruggezet.
- Herkomstlabels: elke bron heeft een label en een plafond op de zekerheid.
- Onbekende OS: zonder entitlement geeft de adapter niets terug in plaats van
  een schatting.
- Berichten: er is geen route die berichten, browsergeschiedenis of locatie
  teruggeeft, en de privé-notitie van een kind komt niet in het gezinsoverzicht.
- Export en verwijderen: het exportbestand vermeldt expliciet wat we nooit
  bewaren; verwijderen kent zeven dagen bedenktijd en is daarna echt.
- Toegankelijkheid: skiplink, één `main`, één `h1`, taalattribuut, zichtbare
  focus.

---

## Structuur / Layout

```
focusfamily/
├── packages/
│   ├── domain/        strikt TypeScript: alle regels, geen framework
│   └── db/            Prisma-schema, migratie, seed, bibliotheekinhoud
├── apps/
│   ├── api/           Fastify + Zod, de enige plek met autorisatie
│   ├── web/           Next.js (marketing, app, beheer)
│   └── mobile/        Expo + expo-router
├── ARCHITECTURE.md
├── NATIVE_CAPABILITIES.md
├── PRIVACY_MODEL.md
├── BEHAVIOURAL_DESIGN.md
├── PRODUCT_DECISIONS.md
└── .env.example
```

## Bekende beperkingen / Known limitations

- **Geen echte OS-schermtijd in deze build.** Dat is een bewuste keuze: zonder
  entitlement tonen we liever niets dan een schatting. De seed bevat daarom
  nul `os_verified`-rijen, en het weekoverzicht zegt dat hardop.
- **Eén gezin per account.** Samengestelde gezinnen met twee huishoudens zijn
  gemodelleerd noch gebouwd.
- **Uitnodigingen gaan niet per e-mail.** Er is geen mailkoppeling.
- **Rate limiting is per proces.** Een echte deployment zet er een gedeelde
  limiter voor.
- **Verwijderen wordt op verzoek uitgevoerd, niet door een cron.** De route
  bestaat zodat de demo de hele cyclus kan tonen.
- **Geen audit door een externe partij.** De privacybeloftes zijn afgedwongen
  in code en tests, wat iets anders is dan gecertificeerd.

The same limitations apply to the English reading: no real OS screen time in
this build (by design), one family per account, no email delivery for
invitations, per-process rate limiting, deletion executed on request rather
than by a scheduler, and no third-party audit.

---

## Licentie / Licence

Dit is een MVP-demonstratie. Er is geen licentie toegekend; neem contact op
voordat je het in productie gebruikt.
This is an MVP demonstration. No licence is granted; get in touch before using
it in production.
