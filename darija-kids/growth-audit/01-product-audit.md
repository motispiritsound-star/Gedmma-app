# 01 — Productaudit

## Wat de app is

Darijaforkids leert kinderen Marokkaans-Arabisch (Darija): de taal die thuis
gesproken wordt en die in geen enkele schoolmethode staat. Zeventien units,
74 lessen, 303 woorden, 28 letters van het Arabische alfabet. Twee minuten per
dag. **BEWEZEN** — geteld uit `src/content/curriculum.ts`.

De interface bestaat in zes talen (`nl, fr, de, es, it, en`), de leertaal is
altijd Darija. Dat is geen taalkundig detail maar de hele markt: de doelgroep
is de Marokkaanse diaspora in Europa, waar het gezin thuis Nederlands, Frans
of Duits spreekt en de taal van de grootouders aan het verdwijnen is.

Techniek: Vite + React 19 + TypeScript + Tailwind 4, verpakt met Capacitor 8
voor iOS en Android. De website darijaforkids.eu komt uit dezelfde repository
maar is een aparte, statische bouw.

## Waarom iemand zou betalen

Eén ding, en het is sterk: **er is geen Darija-stem in een spraakmachine.**
Google, Apple en Amazon kennen Modern Standaard Arabisch; Darija is een
spreektaal zonder standaardspelling en zonder stemmodel. Dus is elk woord,
elke zin en elke letter door een Marokkaanse spreker ingesproken — 432
opnames. **BEWEZEN** — zie `store/opnamelijst.json` en de opnamepijplijn in
`scripts/`.

Dat is de echte slotgracht. Een concurrent met een AI-stem kan dit product
niet maken; een concurrent zonder opnamestudio ook niet. En voor deze ouder is
het precies het punt: hij wil niet dat zijn kind Darija leert met het accent
van een robot uit Caïro.

De tweede reden is dat het een **kindercurriculum** is en niet een
woordenlijst. Er is een pad met zeventien units, een herhaalmotor op basis van
spaced repetition (`src/engine/srs.ts`), diploma's, verhalen, drie spelletjes,
een schrijfoefening en een geschiedenisreeks. Dat is maanden werk dat een
reismodule van een Darija-app voor volwassenen niet heeft.

## Wat er goed is, en niet gezegd hoeft te worden dat het beter kan

Dit hoort in een audit omdat het de zoekruimte verkleint. Deze dingen zijn
geen oorzaak van achterblijvende omzet:

- **Technische kwaliteit.** 117 testbestanden, 2098 tests, alle groen
  (`npm test`, 11,4 s). De bouw loopt schoon door `tsc -b`, `vite build`,
  een bundelcontrole, de sitegenerator en een dode-linkcontrole.
  **BEWEZEN** — zelf uitgevoerd op 10 november.
- **Geen enkele externe SDK.** De hele afhankelijkhedenlijst is Capacitor,
  React, react-router, framer-motion, canvas-confetti en de aankoopplug-in.
  Geen advertenties, geen trackers, geen analytics van derden. **BEWEZEN** —
  `package.json`.
- **De website is snel.** De landingspagina is 28 kB HTML (8 kB gezipt) met
  één stylesheet en geen javascriptraamwerk. Dat is sneller dan vrijwel elke
  concurrent. **BEWEZEN** — gemeten op `site/index.html` na `npm run build`.
- **De ouderpoort en de Kinderen-categorie.** De app staat bij Apple als
  *Made for Kids* (6–8) en bij Google onder het Families-beleid. Elke uitgang
  uit de app — geld, mailadres, externe link — zit achter een
  vermenigvuldiging die een kind van zes niet oplost, en
  `src/ui/kinderslot.test.ts` kent elke uitgang bij naam. **BEWEZEN** —
  `docs/APPLE-2.3.8.md`.

Dat laatste punt is ook een beperking die de rest van deze audit bindt: in de
Kinderen-categorie zijn **analytics van derden verboden**. Alles wat we gaan
meten moet eerstelijns zijn, anoniem en via de eigen server. Daar kom ik in
`08-metrics-experiments.md` op terug.

## Waar de app tekortschiet

### 1. De gratis versie bewijst vrijwel niets

Dit is de belangrijkste bevinding van de hele audit.

```
src/engine/store.ts:35
export const GRATIS_LESSEN: Record<string, number> = { hruf: 3, groeten: 1 }
```

Vier lessen van de 74 staan open. Dat is 5,4% van de cursus. Maar het getal
dat telt is niet het aantal lessen — het is wat een ouder er ziet:

| | Gratis | Totaal |
| --- | --- | --- |
| Lessen | 4 | 74 |
| **Woorden** | **7** | 303 |
| Letters | 13 | 28 |
| Af te maken units | **0** | 17 |
| Diploma's | **0** | 17 |

**BEWEZEN** — uitgerekend uit `GRATIS_WOORDEN` / `GRATIS_LETTERS` in
`src/engine/store.ts:56-57` tegen `src/content/curriculum.ts`.

Zeven woorden. Een ouder die de app binnenkomt zonder de maker te kennen moet
op grond van zeven Darija-woorden besluiten of € 59,99 per jaar het waard is.
**WAARSCHIJNLIJK** is dat te weinig: er is geen moment waarop het kind iets
kan dat het eerst niet kon, en dat moment is het hele verkoopargument van een
leerapp.

Het woordenboek, het alfabet, de verhalen en de spelletjes staan los van het
pad, maar zijn op dezelfde zeven woorden en dertien letters afgeknepen
(`woordOpSlot`, `letterOpSlot`). De code legt uit waarom — anders is de hele
cursus gratis — en die afweging is terecht. De uitvoering is alleen zo streng
geworden dat er niets meer te ervaren valt.

### 2. Beide groeimechanismen zitten achter de betaalmuur

De app heeft twee ingebouwde manieren om nieuwe gebruikers te maken. Geen van
beide kan door een niet-betalende gebruiker worden bereikt.

**De WhatsApp-deelkaart.** `src/engine/delen.ts` noemt WhatsApp in zijn eigen
kop "de motor" van dit product, en dat is juist: in Marokkaans-Nederlandse
families loopt alles via de familiegroep. De kaart verschijnt bij een mijlpaal:

```
src/engine/delen.ts
export const MIJLPALEN = [25, 50, 100, 200, 304] as const
```

De eerste mijlpaal is 25 woorden op kracht ≥ 0,85. Het gratis plafond is
**7 woorden**. De deelkaart is dus onbereikbaar zonder abonnement.
**BEWEZEN** — nagerekend.

**Het verzoek om een winkelbeoordeling.** `src/engine/beoordeling.ts:42` zet
`DIPLOMAS_VOOR_VRAAG = 3`. Een gratis gebruiker kan nul units afmaken, dus nul
diploma's halen, dus die vraag nooit zien. **BEWEZEN.**

In de code staat bij dat getal deze overweging:

> *Drie, en niet vier: bij vier ben je al voorbij de gratis lessen en zit de
> ouder in een gesprek over geld. Die twee vragen moet je niet stapelen.*

De gedachte is goed en de conclusie klopt niet: bij **nul** ben je al voorbij
de gratis lessen. De drempel is niet te hoog gezet voor de gratis gebruiker,
hij is buiten diens bereik gezet.

Het gevolg is dat winkelbeoordelingen — de belangrijkste knop die hij heeft op
zijn vindbaarheid in de App Store, en de enige die hij niet zelf kan indrukken
— alleen van betalende gebruikers kunnen komen. Dat zijn er orde dertien.

### 3. De dagelijkse herinnering staat standaard uit

```
src/engine/store.ts:512
    herinnering: false,
```

Het aanbod staat wel in stap 4 van het welkomstscherm, als schakelaar. Maar
voor een product waarvan de hele belofte "twee minuten per dag" is, is de
herinnering de belangrijkste retentieknop die er is, en hij staat af.
**BEWEZEN.**

**HYPOTHESE:** een kind dat op dag 1 vier lessen doet en daarna niets meer
hoort, komt niet terug. Zonder terugkeer is er ook geen tweede moment waarop
de ouder over het abonnement nadenkt.

### 4. De leeftijdsband is smaller dan het product

Bij Apple staat *Made for Kids* met band **6–8** (`docs/APPLE-2.3.8.md`). Het
curriculum loopt tot werkwoorden, vragen, winkelen en cultuur — dat is stof
voor negen- tot twaalfjarigen. En de marketingfilms zeggen zelf dat
"honderden volwassenen en kinderen" de app gebruiken.

Een ouder met een kind van tien ziet 6–8 staan en bladert door.
**WAARSCHIJNLIJK** kost die band bereik. **ONBEKEND** hoeveel: Apple
rapporteert geen afhaak op de leeftijdsband.

## Welke functies de meeste waarde leveren

Op grond van wat er in de code aan werk zit en wat de films laten zien
(**WAARSCHIJNLIJK**, niet gemeten — zie `08-metrics-experiments.md` voor de
meting die dit zou beslissen):

1. **De opnames.** Het enige dat niet na te maken is.
2. **Het leerpad met diploma's.** Geeft de ouder iets te zien.
3. **De herhaalmotor** (`src/engine/srs.ts`). Het verschil tussen "heeft
   gespeeld" en "kent woorden".
4. **De schrijfoefening** en het alfabet. Dit is wat Arabische les op
   zaterdag ook doet, en wat ouders zelf niet kunnen uitleggen.
5. **De geschiedenisreeks en de verhalen.** Mooi, en het minst verkoopbaar.

## Functies die vooral complexiteit toevoegen

- **De zes interfacetalen.** Verdedigbaar als strategie, duur in onderhoud:
  `vertaald.test.ts` verbiedt onvertaalde teksten, dus elke tekstwijziging is
  zes wijzigingen. En er zit al een scheur in: de klankbeschrijvingen van de
  28 letters in `src/content/alphabet.ts` zijn **niet** gelokaliseerd —
  `ContentPack` heeft geen `letters`-veld. In de Franse app staan daar
  Nederlandse woorden. **BEWEZEN**, en twee keer eerder gemeld.
- **De vijftien-delige boekenreeks en de encyclopedie** in `src/content/`
  (37.163 regels, het grootste gebied van de repository). Dat is een tweede
  product in dezelfde map. Niet verkeerd — zie
  `05-pricing-monetization.md` — maar het is geen app-functie.

## Ontbreekt er één cruciale functionaliteit?

**HYPOTHESE, en de belangrijkste van deze audit:** niet een functie ontbreekt,
maar een *moment*. Er is geen punt in de gratis ervaring waarop een ouder
zijn kind iets Darija hoort zeggen dat het een kwartier eerder niet kon. Zeven
woorden is te kort om dat moment te laten vallen.

Dat is geen nieuwe functie. Het is één constante in `src/engine/store.ts:35`,
en nagerekend is `{ hruf: 8, groeten: 5 }` de kleinste wijziging die werkt —
13 lessen, 27 woorden, 28 letters, 2 diploma's. Alleen de alfabet-unit
openzetten is niet genoeg: die bevat **nul woorden**, en dan blijft de
deelkaart onbereikbaar. **BEWEZEN** — nagerekend tegen
`src/content/curriculum.ts`; de tabel staat in
`growth-audit/05-pricing-monetization.md`.
