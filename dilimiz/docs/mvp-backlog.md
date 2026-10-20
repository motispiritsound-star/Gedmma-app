# Dilimiz — MVP-backlog

Geprioriteerd. **M0** moet er zijn voordat iemand de app kan proberen; **M1**
voordat er iets naar een winkel kan; **M2** is het eerste wat daarna komt.

Status: `klaar` · `deels` · `open` · `jij` (alleen de eigenaar kan dit)

---

## M0 — de eerste werkende stroom

| # | Wat | Status | Waarom het hier staat |
|---|---|---|---|
| 1 | Projectopzet: Vite, React, TS, Vitest, eigen `package.json` | `klaar` | |
| 2 | `merk/` — naam, kleuren, app-ids op één plek | `klaar` | Naam gekozen: Dilimiz. Hernoemen kostte 11 bestanden |
| 3 | Ontwerptokens en basis-CSS, licht én donker | `klaar` | |
| 4 | `engine/turks.ts` — hoofdletters, vergelijken, klinkerharmonie | `klaar` | De `İ`-val gaat stil fout |
| 5 | Inhoudsmodel `content/types.ts` | `klaar` | |
| 6 | Unit 0: letters en klankparen | `klaar` | |
| 7 | Units 1–3: groeten, ik-en-jij, familie | `klaar` | ±90 woorden, ±30 zinnen |
| 8 | Gespreide herhaling (`srs.ts`) | `klaar` | |
| 9 | Opslag op het toestel, met migratiepad | `klaar` | |
| 10 | Oefeninggenerator, acht vormen | `klaar` | Inclusief `klankpaar`, `harmonie`, `plak` |
| 11 | Interfacetalen nl, de, fr, en | `klaar` | |
| 12 | Onboarding: taal, ouderscherm, naam, avatar, leeftijd | `klaar` | |
| 13 | Lespad met voortgang en sloten | `klaar` | |
| 14 | Lesspeler: alle oefenvormen, harten, einde-les | `klaar` | |
| 15 | Herhaalronde uit de planner | `klaar` | |
| 16 | Woordenlijst met sterkte per woord | `klaar` | |
| 17 | Ouderpoort + ouderoverzicht (inzien, meenemen, verwijderen) | `klaar` | AVG-eis en winkeleis |
| 18 | Audio: synthese `tr-TR` als terugval, gemarkeerd | `klaar` | Echte opnames: M1 |
| 19 | Tests op alle bovenstaande lagen | `klaar` | 229 tests, 12 bestanden |
| 19b | Rooktest in een echte browser (`npm run bouw-en-rook`) | `klaar` | Vond twee fouten die de unittests niet zagen |

---

## M1 — wat er moet zijn vóór een winkel

> Bijgewerkt 20 oktober: de lancering is Google Play / Duitsland / € 5,99 per
> maand. Zie `docs/lanceren.md` voor de volgorde.

| # | Wat | Status | Toelichting |
|---|---|---|---|
| 20 | **Play-ontwikkelaarsaccount** | `jij` | € 25, identiteitscontrole duurt dagen tot weken. Begin hiermee |
| 20b | Merkcheck op de naam | `jij` | Geen domein meer nodig (B-8) |
| 21 | **Turkse inhoud nagekeken door moedertaalspreker** | `jij` | B-1. Blokkeert publicatie |
| 22 | **Audio-opnames units 0–3** | `jij` | B-7. Blokkeert publicatie |
| 23 | Spreekoefening met microfoon, niets opgeslagen | `open` | Niet blokkerend: de oefening werkt, er wordt alleen niets opgenomen |
| 23b | Het pad toont 20 slotjes onder elkaar bij een nieuwe gebruiker | `open` | Gezien in de rooktest. Eerlijk, maar het leest als "bijna alles kost geld". Overweeg één samenvattende regel in plaats van een rij |
| 24 | Abonnementsmachine: koop, herstel, verlopen, opgezegd | `klaar` | Aangesloten op `cordova-plugin-purchase`. Hele stroom getest met de nagebootste winkel (`npm run rook-koop`); de échte koop nog niet op een toestel |
| 25 | Abonnementsscherm: prijs, proefduur, verlenging, opzeggen vóór de knop | `klaar` | Winkeleis |
| 26 | Android-schil | `klaar` | `android/`, app-id `app.dilimiz.learn`, ondertekening gekoppeld |
| 26b | iOS-schil | `open` | Niet bij de lancering: Mac nodig en € 99 per jaar (B-8) |
| 27 | Pictogram, startscherm, winkelbeelden | `klaar` | `npm run beeld` en `npm run schermen`. Het merkteken blijft een plaatshouder tot er een logo getekend is |
| 28 | Privacyverklaring op een werkend webadres | `deels` | `npm run privacy` schrijft hem in vier talen; online zetten is `jij` |
| 29 | Winkelvermelding | `klaar` | Duitse teksten staan in `docs/lanceren.md`, met de Facebook-tekst erbij |
| 30 | Juridische controle van de lijst in `privacy-and-safety.md` | `jij` | |
| 31 | Abonnement aanmaken: `app.dilimiz.monthly`, € 5,99, geen proef | `jij` | B-6. En koop hem één keer zelf met een testaccount |
| 32 | `geennetwerk.test.ts` over de echte bundel in CI | `open` | Nu over de bronbestanden |
| 33 | Uitgeefscripts | `klaar` | Eigen versies: `sleutel`, `aab`, `beeld`, `schermen`, `privacy` |
| 34 | Toegankelijkheid: contrast, schermlezer, grote letters | `deels` | Tokens zijn nagemeten; schermlezer nog niet getest |

---

## M2 — direct daarna

| # | Wat | Waarom niet eerder |
|---|---|---|
| 35 | Units 4–6: thuis, eten, school | Pas inhoud bijmaken als de vorm bewezen is |
| 36 | Gezinsopdrachten, één per unit | Het onderscheidende deel, maar werkt pas met vier units |
| 37 | Badges en doelen | Motivatie is nu de voortgangsbalk en de reeks |
| 38 | Offline downloaden per unit | Nu is álles gebundeld; pas nodig als er audio bij komt |
| 39 | Leeftijdsgroepen `klein` en `groot` volledig | B-4 |
| 40 | Tweede profiel per toestel | P-4 |
| 41 | Diploma per unit, door een ouder te ondertekenen | Werkt pas met een afgeronde unit |
| 42 | Dagelijkse herinnering, door de ouder ingesteld | Achter de poort, uit tot erom gevraagd wordt |

---

## Bewust niet in de MVP

| Wat | Waarom niet |
|---|---|
| Score op de uitspraak | P-3: onbetrouwbaar, en een onterechte "fout" is schadelijk |
| Geschiedenis- en cultuurreeks | B-3: eigen project met redactie |
| Verhalenbibliotheek | Pas waardevol boven ±300 woorden |
| Sociale laag, ranglijst, chat | Kinderapp. Zie `privacy-and-safety.md` |
| Analytics | Zie `privacy-and-safety.md`. Bewuste prijs |
| Eigen server, account, synchronisatie | A-4 |
| Webversie als product | De site is etalage |

---

## De eerstvolgende drie dingen

1. **Inhoud laten nakijken** (jij, #21) — dit is het grootste
   kwaliteitsrisico, en het kost een middag van iemand anders.
2. **Domein vastleggen en merkcheck** (jij, #20) — de naam staat vast, de
   vrijheid van gebruik niet.
3. **Microfoon aansluiten** (#23) — de laatste ontbrekende oefenvorm.
