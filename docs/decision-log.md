# Beslissingenlogboek

Architecture Decision Records. Elke afwijking van de gevraagde
voorkeursarchitectuur staat hier met motivatie.

---

## ADR-001 — Webscan NL blijft bestaan en verhuist naar `apps/webscan`

**Datum** 2026-08-30 · **Status** aanvaard

**Context.** De repository bevatte een compleet, werkend en goed onderhouden
ander product (leadgeneratie via websitescans), circa 8.800 regels TypeScript
met eigen tests, demo en documentatie. De opdracht was expliciet om bestaande,
werkende onderdelen niet zonder noodzaak te verwijderen.

**Besluit.** Webscan NL is met `git mv` verplaatst naar `apps/webscan` en is
daar een zelfstandig workspace-pakket. Er is geen regel domeinlogica gewijzigd.
De enige aanpassing is dat `start.js` zijn ingang naast zichzelf zoekt in plaats
van in de werkmap, zodat het commando vanuit de root blijft werken.

**Gevolgen.** De repository bevat twee producten. Dat is bewust: de opdracht
verbood weggooien, en de monorepo maakt de scheiding expliciet. Als Webscan NL
ooit een eigen repository moet krijgen, is dat één `git filter-repo` weg.

---

## ADR-002 — Modulaire monoliet op een eigen HTTP-laag in plaats van NestJS

**Datum** 2026-08-30 · **Status** aanvaard

**Context.** De voorkeursstack noemt "NestJS of een vergelijkbaar modulair
TypeScript-framework". NestJS steunt op decorators en `emitDecoratorMetadata`.
Node 22 voert TypeScript rechtstreeks uit door types te strippen, maar
ondersteunt géén decorators; NestJS dwingt dus een buildstap af.

**Besluit.** Een eigen, dunne HTTP-laag op Express met expliciete
modulesamenstelling en constructor-injectie via een kleine container. Modules
hebben dezelfde vorm als in NestJS (`module.ts`, `service.ts`, `repo.ts`,
`routes.ts`), maar zonder decorators.

**Alternatieven.** NestJS met SWC-build (extra bouwtijd, extra complexiteit voor
elke ontwikkelaar), Fastify met plug-ins (vergelijkbaar met de gekozen oplossing,
maar Express stond al in de repository).

**Gevolgen.** Geen buildstap voor de backend; snelle start; de stack blijft
klein. Prijs: routing, validatie en foutafhandeling zijn zelf geschreven — daar
staat tegenover dat ze expliciet en leesbaar zijn, wat voor financiële software
een voordeel is. Als decorators later toch nodig blijken, is de stap naar NestJS
per module mogelijk omdat de grenzen al kloppen.

---

## ADR-003 — `pg` met eigen migratierunner in plaats van Prisma

**Datum** 2026-08-30 · **Status** aanvaard

**Context.** De voorkeursstack noemt Prisma. Drie eisen botsen daarmee:

1. **Row-level security.** Tenantisolatie werkt via
   `set_config('gedmma.administration_id', ..., true)` aan het begin van elke
   transactie. Prisma biedt daarvoor alleen `$executeRaw` binnen een interactieve
   transactie; de garantie dat het altijd gebeurt, moet je alsnog zelf bouwen.
2. **Exacte bedragen.** Prisma's `Decimal` werkt, maar het typemodel nodigt uit
   tot `Number()`-conversies. Een eigen `Money` met `bigint` minor units, gevoed
   door een `NUMERIC`-typeparser die strings afdwingt, sluit de fout structureel uit.
3. **Databaseobjecten die Prisma niet modelleert.** Triggers voor
   onveranderbaarheid, `CHECK`-constraints op debet/credit, RLS-policies en
   partiële unieke indexen zijn de kern van de correctheidsgarantie. Die zouden
   toch in ruwe SQL-migraties terechtkomen, waardoor het schema op twee plekken
   leeft.

**Besluit.** `pg` met een handgeschreven, genummerde migratierunner (hetzelfde
patroon dat het bestaande Webscan-product al gebruikte) en een dunne, getypeerde
querylaag waarin SQL uitsluitend in `repo.ts`-bestanden staat.

**Gevolgen.** Meer eigen SQL, geen automatisch gegenereerde client. Daar staat
tegenover: volledige controle over transacties en RLS, geen enginebinaries, en
één plek waar het schema leeft. Typeveiligheid wordt geborgd door expliciete
rijtypen per repository plus integratietests die elke query echt uitvoeren.

---

## ADR-004 — Vite + React SPA in plaats van Next.js

**Datum** 2026-08-30 · **Status** aanvaard

**Context.** De voorkeursstack noemt Next.js. De webapp is een volledig
afgeschermde back-office: elk scherm zit achter authenticatie en een
administratiekeuze. Server-side rendering en SEO leveren daar niets op.

**Besluit.** Vite + React als single-page application met client-side routing.

**Onderbouwing.**
* Geen SEO- of SSR-behoefte achter de login.
* Dezelfde statische bundel is direct herbruikbaar in de Tauri-desktopapp
  (fase 5); Next.js met SSR maakt dat juist ingewikkelder.
* Kortere build- en herlaadtijden, wat bij een product met tientallen schermen
  meetelt.
* Eén duidelijke grens: de browser praat uitsluitend via de REST-API, wat het
  contract met de mobiele apps identiek houdt.

**Gevolgen.** Een publieke marketingsite (met SEO-belang) wordt later een eigen
Next.js-app; die deelt het design system via `packages/`. De SPA moet zelf
zorgen voor code-splitting per route en voor een goede eerste-laadervaring.

---

## ADR-005 — Taken in PostgreSQL, Redis/BullMQ als latere driver

**Datum** 2026-08-30 · **Status** aanvaard

**Context.** De voorkeursstack noemt Redis met BullMQ. Voor de MVP is de
belangrijkste eis dat een taak **in dezelfde transactie** als de boeking kan
worden ingepland: anders bestaat de situatie "factuur definitief, maar e-mail
nooit ingepland".

**Besluit.** Een `JobQueue`-interface met een PostgreSQL-driver
(`FOR UPDATE SKIP LOCKED`, exponentiële backoff, dead-letter-status) als
standaard. De Redis/BullMQ-driver komt in fase 3 achter dezelfde interface,
voor werk dat geen transactionele koppeling met de database nodig heeft.

**Gevolgen.** Eén afhankelijkheid minder in de MVP en transactionele
betrouwbaarheid. Bij zeer hoge volumes is Postgres als wachtrij niet de
eindoplossing; de interface maakt de overstap per taaksoort mogelijk.

---

## ADR-006 — Bedragen als `bigint` minor units in de applicatie, `NUMERIC` in de database

**Datum** 2026-08-30 · **Status** aanvaard

**Context.** De opdracht eist `decimal`/`numeric` in de database en verbiedt
floating point. In JavaScript is er geen native decimaal type.

**Besluit.** In de database `NUMERIC(18,2)` voor bedragen, `NUMERIC(18,8)` voor
koersen en `NUMERIC(18,6)` voor aantallen. In de applicatie een `Money`-type met
een `bigint` in centen. De `pg`-typeparser voor `NUMERIC` is overschreven zodat
er altijd een string terugkomt, die rechtstreeks naar `bigint` wordt omgezet.
`Number()` op een bedrag is verboden en wordt door een lint-regel geweigerd.

**Gevolgen.** Geen enkele afrondingsonzekerheid. Verdelingen lopen via
`Money.allocate`, dat het restant deterministisch over de delen verdeelt zodat
de som exact klopt.

---

## ADR-007 — Node-eigen testrunner met `fast-check`, geen Jest/Vitest in de backend

**Datum** 2026-08-30 · **Status** aanvaard

**Context.** De voorkeursstack noemt Vitest/Jest. De backend draait TypeScript
rechtstreeks op Node; `node:test` doet dat ook, zonder transformlaag.

**Besluit.** `node:test` met `node:assert/strict` voor unit- en integratietests,
`fast-check` voor property-based tests, Playwright voor end-to-end. De webapp
gebruikt Vitest, omdat daar toch al een Vite-transformlaag staat.

**Gevolgen.** Geen transformlaag die het gedrag van de productiecode verandert —
voor een financiële kern een voordeel. Minder ecosysteem (geen snapshot-magie);
snapshots van financiële rapporten worden als expliciete JSON-fixtures bewaard,
wat leesbaarder is in code review.

---

## ADR-008 — Wachtwoorden met `scrypt` uit `node:crypto`, Argon2id als migratiepad

**Datum** 2026-08-30 · **Status** aanvaard

**Context.** Argon2id is de voorkeur van OWASP, maar vereist een native module
die op elk platform gebouwd moet worden.

**Besluit.** `scrypt` (N=2^16, r=8, p=1, 32-byte sleutel) uit `node:crypto`, met
per-gebruiker salt en een server-side pepper. De hasher zit achter een
`PasswordHasher`-interface en elke hash draagt een algoritme-prefix, zodat
overstappen naar Argon2id kan zonder dat gebruikers hun wachtwoord opnieuw
moeten zetten: bij de eerstvolgende geslaagde login wordt herhasht.

**Gevolgen.** Geen native afhankelijkheden, wel een breed erkend algoritme.
De parameters staan in configuratie zodat ze meegroeien met hardware.

---

## ADR-009 — Nederlands als taal van de code

**Datum** 2026-08-30 · **Status** aanvaard

**Context.** De bestaande repository is volledig Nederlandstalig: variabelen,
commentaar, foutmeldingen en documentatie. Het product is Nederlands, het domein
is Nederlands en de doelgroep is Nederlands.

**Besluit.** Domeintaal en documentatie in het Nederlands; technische
standaardbegrippen (`repository`, `middleware`, `debit`, `credit`) blijven Engels
waar dat de leesbaarheid helpt. Publieke API-velden zijn Engels, omdat externe
integraties daarop rekenen.

**Gevolgen.** Consistent met wat er stond. De grens tussen "domein Nederlands" en
"API Engels" ligt bij de serialisatielaag en is daar expliciet gemaakt.
