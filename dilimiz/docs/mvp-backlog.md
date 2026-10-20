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

| # | Wat | Status | Toelichting |
|---|---|---|---|
| 20 | **Domein vastleggen en merkcheck** | `jij` | B-2. De naam is Dilimiz; domein en vrijheid van gebruik nog open. Blokkeert 26, 27, 28 |
| 21 | **Turkse inhoud nagekeken door moedertaalspreker** | `jij` | B-1. Blokkeert publicatie |
| 22 | **Audio-opnames units 0–3** | `jij` | B-7. Blokkeert publicatie |
| 23 | Spreekoefening met microfoon, niets opgeslagen | `open` | Nu een plaatshouder: de oefening staat er, de microfoon nog niet |
| 23b | Het pad toont 20 slotjes onder elkaar bij een nieuwe gebruiker | `open` | Gezien in de rooktest. Eerlijk, maar het leest als "bijna alles kost geld". Overweeg één samenvattende regel in plaats van een rij |
| 24 | Abonnementsmachine: koop, herstel, verlopen, opgezegd | `deels` | Logica en scherm staan er; `cordova-plugin-purchase` nog niet aangesloten |
| 25 | Abonnementsscherm: prijs, proefduur, verlenging, opzeggen vóór de knop | `klaar` | Winkeleis |
| 26 | Native schillen `android/` en `ios/` | `open` | App-id staat vast (`app.dilimiz.learn`); kan nu met één `cap add` |
| 27 | Logo, pictogram, startscherm | `open` | Naam staat vast, dus dit kan nu getekend worden. Nu een plaatshouder-SVG met de D |
| 28 | Privacyverklaring op een werkend webadres | `open` | Beide winkels eisen dit |
| 29 | Winkelvermeldingen in vier talen | `open` | |
| 30 | Juridische controle van de lijst in `privacy-and-safety.md` | `jij` | |
| 31 | Proefperiode in **beide** consoles op **beide** plannen | `jij` | B-6. De duurste les uit de overdracht |
| 32 | `geennetwerk.test.ts` over de echte bundel in CI | `open` | Nu over de bronbestanden |
| 33 | Uitgeefscripts overnemen uit `darija-kids/scripts/` | `open` | Pas ná de naamkeuze; ze dragen de oude merknaam |
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
