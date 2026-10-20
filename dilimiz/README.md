# Dilimiz

Turks leren voor kinderen en gezinnen uit de Turkse diaspora in Europa.
*Dilimiz* is Turks voor "onze taal".

> **Stand: in ontwikkeling.** De app loopt en is te doorlopen van het
> welkomstscherm tot een afgeronde les. Wat er nog niet is: opnames door
> moedertaalsprekers, een inhoudscontrole door een moedertaalspreker, de
> native schillen en de winkelkant. Zie `docs/mvp-backlog.md`.

## Snel beginnen

```bash
npm install
npm run dev
```

| Opdracht | Wat het doet |
|---|---|
| `npm run dev` | Ontwikkelserver |
| `npm run build` | Typecontrole + bouw naar `dist/` |
| `npm test` | Vitest |
| `npm run bouw-en-rook` | Bouwt en loopt de app door in een echte browser |
| `npm run nakijklijst` | Alle Turkse inhoud als één bestand om te laten nakijken |
| `npm run opnamelijst` | Het opnamescript voor de stemacteurs |

## Wat dit is

Een zelfstandige leerapp, gebouwd op de techniek van Darijaforkids maar met
een eigen naam, merk, didactiek en inhoud. Niets van dat merk komt mee — zie
`docs/brand-brief.md`, en `src/merk/merk.test.ts`, dat het nameet in plaats
van het te beloven.

De inhoudelijke kern: het kind in de doelgroep **begrijpt** Turks meestal wel
en **spreekt** het niet. Daarom oefent deze app vanaf les één produceren, en
niet alleen herkennen.

Drie oefenvormen bestaan speciaal voor wat Turks moeilijk maakt en in de
oorspronkelijke app niet voorkwam:

| Vorm | Wat het oefent |
|---|---|
| `klankpaar` | `kıl` tegenover `kil`, `koy` tegenover `köy` — twee echte woorden die in één letter verschillen |
| `harmonie` | Klinkerharmonie: wordt het `-de` of `-da`, `-te` of `-ta`? |
| `plak` | Agglutinatie: `ev` → `evler` → `evlerimiz` → `evlerimizde` |

En drie komen juist níet mee: letters natekenen, lettervormen voor begin,
midden en eind, en rechts-naar-links lezen. Turks is Latijns schrift.

## Privacy

Geen account, geen server, geen advertenties, geen analytics, geen tracking.
Alle voortgang staat op het toestel. De ouder kan alles inzien, meenemen en
verwijderen, achter een ouderpoort.

Dat is geen belofte maar een meting: `src/engine/privacy.test.ts` scant de
broncode en faalt als er een SDK, een netwerkverzoek of een cookie bij komt.
Zie `docs/privacy-and-safety.md`.

## Documentatie

| | |
|---|---|
| `docs/product-brief.md` | Voor wie, welk probleem, en hoe we weten of het werkt |
| `docs/brand-brief.md` | Naam, palet, vorm, mascotte, toon |
| `docs/learning-curriculum.md` | Wat een kind leert, en in welke volgorde |
| `docs/architecture.md` | Hoe het technisch in elkaar zit |
| `docs/privacy-and-safety.md` | Wat we opslaan, wat niet, en wat juridisch nagekeken moet |
| `docs/decisions.md` | Elk besluit met de reden en wat het kost |
| `docs/mvp-backlog.md` | Wat er nog moet, op volgorde |
| `CLAUDE.md` | Wat je moet weten vóór je code aanraakt |

## Verhouding tot de rest van deze repository

| Map | Wat | |
|---|---|---|
| `dilimiz/` | **Deze app** | |
| `../darija-kids/` | Kopie van Darijaforkids | **Alleen-lezen referentie.** Niet wijzigen |
| `../apps/`, `../packages/` | Buurklus, een ouder project | Niet aanraken |
