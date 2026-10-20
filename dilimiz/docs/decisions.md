# Dilimiz — besluiten en aannames

Elk besluit met de datum, wat er gekozen is, waarom, en wat het kost. Een
besluit dat terug te draaien is, staat als omkeerbaar gemarkeerd — dan is het
een aanname en geen afspraak.

Letters: **A** = architectuur, **B** = besluit dat jij moet bevestigen,
**P** = product.

---

## A-1 · Eigen map in deze repository, geen nieuwe repository

**20 oktober 2026 · vastgelegd**

De overdracht (`darija-kids/docs/TWEEDE-APP.md`) vraagt om een aparte
repository. Dat is hier niet gedaan: de opdracht was om in
`motispiritsound-star/Gedmma-app` te werken, en die repository bestond al met
`darija-kids/` erin als kopie.

De app staat daarom in `turks/`, naast — en volledig los van —
`darija-kids/` en het oudere Buurklus-project. Geen gedeelde
`package.json`, geen gedeelde afhankelijkheden, geen import over de grens.

**Wat het kost:** de winkelaccounts, ondertekensleutels en uitrolpaden zijn
gescheiden (zoals de overdracht wil), maar de repositorygeschiedenis is
gemeenschappelijk. Als deze app ooit zijn eigen repository krijgt, is dat
`git subtree split` en geen herschrijving.

**Omkeerbaar:** ja.

---

## A-2 · De merknaam staat in één bestand

**20 oktober 2026 · vastgelegd**

`src/merk/merk.ts` houdt naam, app-id, domein en abonnementsproducten.
Interfaceteksten gebruiken `{naam}` en nooit de naam zelf.
`src/merk/merk.test.ts` faalt als er een letterlijke merknaam in `i18n/` of
`content/` staat.

**Waarom:** de naam is nog niet gekozen, en in de referentie-app staat de
merknaam in 267 bestanden. De overdracht waarschuwt daar expliciet voor.

**Wat het kost:** niets dat ertoe doet. Een extra import per bestand.

---

## A-3 · Geen Tailwind; eigen ontwerptokens in gewone CSS

**20 oktober 2026 · vastgelegd**

**Waarom:** het merk is nieuw. Tailwind-klassen uit de referentie-app
overnemen is het oude ontwerp meenemen zonder dat te bedoelen — en de kleuren
van die app zitten in de klassennamen. Eén afhankelijkheid minder, en de
tokens staan op één plek waar `kleuren.test.ts` ze kan nameten.

**Wat het kost:** meer CSS met de hand. Bij een groter ontwerpsysteem zou
Tailwind winnen; bij een app met tien schermen niet.

**Omkeerbaar:** ja, maar na de MVP niet meer goedkoop.

---

## A-4 · Alles op het toestel, geen server, geen account

**20 oktober 2026 · vastgelegd**

**Waarom:** het is een kinderapp (zie `privacy-and-safety.md`), ze moet
offline werken in een Turks dorp, en geen server is geen gegevenslek.

**Wat het kost:** nieuwe telefoon is nieuwe voortgang. Zie B-5.

---

## A-5 · Eigen oefenvormen voor wat Turks moeilijk maakt

**20 oktober 2026 · vastgelegd**

Drie oefenvormen die in de referentie-app niet bestaan:
`klankpaar` (ı/i, o/ö, u/ü, c/ç, s/ş), `harmonie` (het goede achtervoegsel) en
`plak` (agglutinatie bouwen).

En drie die niet meekomen: het natekenen van letters, de lettervormen
(begin/midden/eind) en alles rondom rechts-naar-links lezen.

**Waarom:** de overdracht zegt het scherp — *"de machine erven, de les opnieuw
ontwerpen"*. Een Turkse cursus die een Arabische cursus vertaalt, oefent de
verkeerde dingen.

---

## A-6 · Turkse tekstbewerking in een eigen module

**20 oktober 2026 · vastgelegd**

`src/engine/turks.ts`. `'i'.toUpperCase()` geeft in JavaScript `I` en niet
`İ`, en `'İ'.toLowerCase()` geeft `i` met een losse punt erachter. Dat gaat
stil fout, en juist in de letters die deze app onderwijst.

Daarom: één module die hoofdletters, vergelijken, sorteren en klinkerharmonie
doet, met `toLocaleUpperCase('tr')`; en nergens `text-transform` in de CSS op
een element dat Turks bevat.

---

## P-1 · Units 0–3 zijn de MVP

**20 oktober 2026 · aanname, omkeerbaar**

Letters en klanken, groeten, ik-en-jij, familie. Ongeveer 90 woorden, 30
zinnen, vier units.

**Waarom:** dat is genoeg om te zien of de app werkt (drie lessen in 48 uur,
dag 7 nog actief) en genoeg voor een kind om iets te kunnen zeggen. Meer
inhoud maken vóór we weten of de vorm deugt, is inhoud die opnieuw moet.

---

## P-2 · Produceren vanaf les één

**20 oktober 2026 · aanname, omkeerbaar**

Al in de eerste les wordt getypt en ingesproken, niet alleen aangewezen.

**Waarom:** het kernprobleem van de doelgroep is passieve tweetaligheid — het
kind begrijpt en spreekt niet. Herkenningsoefeningen trainen precies wat het
al kan.

**Risico:** het kan te zwaar zijn voor de groep `klein`. Daar staat typen
standaard uit. Te meten zodra er gebruikers zijn.

---

## P-3 · Geen score op de uitspraak

**20 oktober 2026 · vastgelegd**

De spreekoefening werkt, er is geen beoordeling.

**Waarom:** herkenning van een kinderstem in het Turks is onbetrouwbaar, en
een onterechte "fout" op iets wat een kind net durfde, is erger dan geen
getal.

---

## P-4 · Eén profiel per toestel

**20 oktober 2026 · aanname, omkeerbaar**

**Waarom:** twee profielen verdubbelen elke voortgangsvraag, elk scherm en
elke test, en de meeste gezinnen beginnen met één kind.

**Wat het kost:** een gezin met twee kinderen moet delen. De opslag is er wel
op voorbereid (voortgang hangt aan een profiel-id), zodat dit later geen
herschrijving is.

---

## B-1 · Alle Turkse inhoud moet nagekeken worden · **jij**

**20 oktober 2026 · open**

Alle Turkse strings zijn opgeschreven met zorg, en **geen enkele is nagekeken
door een moedertaalspreker.** Elk inhoudsitem heeft een veld `nagekeken`, nu
overal `false`. `content/nagekeken.test.ts` drukt af hoeveel.

**Dit is de belangrijkste openstaande taak.** Een ouder die zelf Turks spreekt
en een fout ziet in les één, komt niet terug — en dat is precies de ouder die
betaalt.

**Wat jij moet doen:** een moedertaalspreker of Turkse taaldocent de lijst
laten doornemen. Het script `npm run nakijklijst` schrijft hem als één
leesbaar bestand.

Specifiek twijfelachtig en expliciet te controleren:
- `nerelisin?` en de antwoorden erop — of dat de natuurlijke vraag is voor een
  kind in de diaspora, of dat `nereden geliyorsun?` beter past;
- `hoşça kal` versus `güle güle` — wie zegt wat, en of de les dat goed uitlegt;
- `abi` versus `ağabey` in de schrijfwijze die een kind moet leren;
- of `sağ ol` te informeel is voor een eerste les;
- de klankparen in `klankparen.ts`: of ze echt minimaal zijn, en of elk woord
  past bij een kind van zeven.

---

## B-2 · De naam is Dilimiz; domein en merkcheck nog open · **deels jij**

**20 oktober 2026 · naam beslist, rest open**

**Dilimiz** — Turks voor "onze taal". Gekozen door de eigenaar.

Het hernoemen kostte één opdracht over 11 bestanden en 32 regels, omdat A-2
dat zo had opgezet. In de referentie-app zou dit 267 bestanden zijn geweest.

Vastgelegd:

| | |
|---|---|
| Naam | `Dilimiz` |
| App-id | `app.dilimiz.learn` |
| Abonnement jaar | `app.dilimiz.yearly` |
| Abonnement maand | `app.dilimiz.monthly` |
| Opslagsleutel | `dilimiz.v1` |
| Map in de repository | `dilimiz/` |

**Nog open, en dit blokkeert de winkel:**

1. **Het domein.** `dilimiz.eu`, `.app` of `.com` — nog niet vastgelegd.
   `MERK.domein` staat daarom leeg en niet op een gok: een link naar een
   domein dat niet bestaat is erger dan geen link, en de winkels controleren
   erop.
2. **Vrijheid van gebruik.** EUIPO, Benelux, en beide winkelzoekbalken.
   `dilimiz` is een gewoon Turks woord — begrijpelijk, en daardoor ook
   moeilijker te beschermen en waarschijnlijk al ergens in gebruik. Laat een
   merkcheck doen. Dit is geen juridisch advies.

**Wat ik erbij heb aangetekend, zonder dat het de keuze verandert:** "onze
taal" veronderstelt dat de lezer erbij hoort, en een deel van de doelgroep
twijfelt daar juist aan. Dat is in `brand-brief.md` §De naam opgelost in de
teksten en niet in de naam: het "onze" is een uitnodiging en nergens een
toelatingseis.

---

## B-3 · Culturele inhoud krijgt redactie, geen improvisatie

**20 oktober 2026 · vastgelegd als regel, uitvoering open**

Geen cultureel of historisch gegeven in de app zonder herkomst in
`content/bronnen.ts`. Geen geschiedenisreeks in de MVP.

**Wat jij moet doen:** beslissen of de boekenreeks uit de referentie-app
meekomt. De overdracht zegt er het juiste over: *"vijftien boeken over Turkse
geschiedenis is een eigen project, geen bijlage."*

---

## B-4 · Leeftijdsgroepen: drie, of eerst één? · **jij**

**20 oktober 2026 · aanname, omkeerbaar**

Nu: drie groepen in de data (`klein`, `midden`, `groot`), en in de MVP werkt
`midden` volledig uit. `klein` en `groot` schakelen lesduur, typen en toon,
maar krijgen geen eigen schermen.

**Waarom:** drie volledig uitgewerkte leeftijdsvormen is drie keer de UI. De
data-opzet houdt de deur open.

---

## B-5 · Voortgang overzetten naar een nieuw toestel

**20 oktober 2026 · aanname, omkeerbaar**

Geen account, dus geen synchronisatie. In plaats daarvan: **Meenemen** op het
ouderoverzicht schrijft een JSON-bestand, en **Terugzetten** leest het.

**Wat het kost:** een ouder moet dat zelf doen, en zal het niet doen. Dat is
de prijs van geen server, en hij is bewust betaald.

---

## B-6 · Eén maandplan van € 5,99, maandelijks opzegbaar · **beslist**

**20 oktober 2026 · vastgelegd door de eigenaar**

| | |
|---|---|
| Altijd gratis | De eerste 4 lessen: 3 uit unit 0 (letters) en de eerste van groeten |
| Abonnement | € 5,99 per maand, maandelijks opzegbaar |
| Proefperiode | **Geen** bij de lancering |
| Jaarplan | **Niet** bij de lancering |
| Eerste markt | Duitsland |

**Waarom één plan en geen twee.** Elk extra product moet in de console
aangemaakt, geprijsd en nagekeken worden, en de duurste fout van de vorige app
ontstond juist doordat twee plannen niet gelijk stonden. Een jaarplan erbij is
later één regel in `abonnement.ts`, één id in `merk.ts` en één product in de
console.

**Waarom geen proefperiode.** De vier gratis lessen zijn het proberen. Een
proefperiode is een extra instelling die goed moet staan voordat er betaald
verkeer op komt. En het kost niets om hem later toe te voegen: het scherm
leest de winkel, dus zet hem in de Play Console aan en de app past zich aan —
zonder codewijziging. `abonnement.test.ts` legt dat vast.

**Waarom lessen en geen units gratis.** Een unit afmaken is weken werk, en
tegen die tijd probeert niemand de app meer uit. Vier lessen is ongeveer
twintig minuten: lang genoeg om het Turkse alfabet te kunnen lezen en
`merhaba`, `teşekkür ederim` en `görüşürüz` te kunnen zeggen — iets wat een
kind dezelfde avond kan laten zien — en kort genoeg dat de vraag "en dan?"
komt terwijl het nog leuk is.

**Wat open blijft.** Of € 5,99 het goede bedrag is. Dat is niet te beredeneren
en wel te meten: zie `docs/lanceren.md` §Wat je in de eerste week meet.

---

## B-8 · Duitsland eerst, Android eerst, geen website · **beslist**

**20 oktober 2026 · vastgelegd door de eigenaar**

De lancering is Google Play in Duitsland. Geen iOS bij de start (een Mac en
€ 99 per jaar), geen website, geen marketingsite. Verspreiding via
Facebook-groepen.

**Wat dat schrapt:** de Cloudflare-opzet, de etalagepagina's, de
winkelteksten voor vijf landen, en het domein. `MERK.domein` blijft leeg.

**Wat het níet schrapt:** de privacyverklaring. Beide winkels eisen die op een
openbaar webadres, ook als de app niets verzamelt. Dat is één bestand en geen
website — `npm run privacy` schrijft het, en het staat in dertig seconden
online via Netlify Drop.

**Het risico dat hierbij hoort, en het is het echte:** Duitsland is de grootste
Turkstalige markt van Europa, dus ook de markt met de meeste ouders die zelf
Turks spreken. Een fout in les één kost daar een betalende klant. Dat maakt
B-1 (de inhoud laten nakijken) geen nette bijzaak maar de belangrijkste stap
vóór er betaald verkeer op komt.

---

## B-7 · Audio: lanceren kan niet met een computerstem

**20 oktober 2026 · vastgelegd**

Tot er opnames zijn, gebruikt de app de spraaksynthese van het toestel in
`tr-TR`, zichtbaar gemarkeerd als computerstem.

**Geen publicatie in een winkel zonder echte opnames voor units 0–3.** Een
kind dat `ğ` van een synthesestem leert, leert hem verkeerd.

**Wat jij moet doen:** twee sprekers (een vrouwenstem en een kinderstem), een
stille kamer. `npm run opnamelijst` schrijft de lijst.

---

## Wat er nu op jouw bord ligt

| | Wat | Blokkeert |
|---|---|---|
| — | **Play-ontwikkelaarsaccount aanvragen** — dit duurt het langst | Alles aan de winkelkant |
| B-2 | Merkcheck op de naam (het domein is niet meer nodig) | Niets technisch |
| B-1 | Turkse inhoud laten nakijken | Publicatie |
| B-7 | Opnames regelen | Publicatie |
| B-6 | ✅ Beslist: € 5,99 per maand, geen proefperiode, Duitsland eerst | — |
| B-3 | Besluit over de boekenreeks | Niets in de MVP |
| B-4 | Leeftijdsgroepen bevestigen | Niets in de MVP |
