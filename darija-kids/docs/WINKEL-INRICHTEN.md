# De winkel openen

Eén avond werk, en daarna kun je zelf een boek bestellen om te kijken of het
klopt.

## Waarom niet gewoon je eigen bankrekening

Dat mag niet zomaar, en dat is geen formaliteit.

Je verkoopt een **digitaal product aan consumenten in de hele EU**. De btw die
je daarover moet afdragen is die van het land van de *koper*, niet van jou. Een
Duitse ouder betaalt 19%, een Nederlandse 21%, een Franse 20%. Dat moet je per
land bijhouden en per kwartaal aangeven.

Daar zijn twee uitwegen:

1. **Zelf doen via de OSS-regeling** bij de Belastingdienst. Kan, is legaal, en
   betekent dat je elk kwartaal een aangifte per land doet. Bij twintig boeken
   per maand is dat meer administratie dan omzet.
2. **Een merchant of record.** Dan is dát bedrijf de verkoper. Zij innen de
   btw, dragen hem af, leveren het bestand, doen de terugbetalingen en de
   klantenservice over betalingen. Jij krijgt één keer per maand een bedrag
   gestort met één factuur.

Dit project gaat uit van de tweede weg. Vandaar dat er op de afrekenpagina
staat dat er een andere naam op je afschrift verschijnt: dat is geen
slordigheid, dat is wie de verkoper is.

Zie `docs/BETALEN.md` voor de langere versie.

## Welke partij

| | Lemon Squeezy | Gumroad |
| --- | --- | --- |
| Merchant of record | ja | ja |
| Meteen beginnen | goedkeuring, meestal 1–2 dagen | direct |
| Kosten | 5% + $0,50 per verkoop | 10% per verkoop |
| Uitbetaling | naar je bankrekening | PayPal of bankrekening |
| Meerdere bestanden per product | ja | ja |

**Wil je vanavond testen, neem Gumroad.** Je kunt er binnen een kwartier een
product mee online hebben. De 10% is hoger, maar bij de eerste verkopen gaat
het om een paar euro en je kunt later overstappen — de links in
`src/site/shop.ts` vervang je dan gewoon.

Wil je het meteen goed neerzetten en kun je twee dagen wachten, neem Lemon
Squeezy.

**Kijk bij het inrichten welke betaalmethoden aanstaan.** iDEAL, Bancontact en
Apple Pay zitten niet bij elke partij standaard aan, en voor Nederlandse
ouders is iDEAL het verschil tussen kopen en afhaken. Staat het er niet bij,
vraag het aan hun ondersteuning voordat je verdergaat.

## Stap 1 — De bestanden maken

In de projectmap:

```bash
npm run winkel
```

Dit zet elk boek dat er nog niet staat — twaalf delen van Sba en vijftien van
De sleutels, elk in zes talen — en maakt er drie zips van in `store/winkel/`.
Ernaast komt `producten.md`: per product de titel, de prijs, het bestand en de
tekst voor de productpagina, klaar om te plakken.

De eerste keer duurt dat een kwartier: er moeten tweeënnegentig boeken door de
zetter. Daarna gaat het in seconden, want wat er al staat wordt overgeslagen.
Eén reeks kan ook: `npm run winkel -- --sba` of `npm run winkel -- --sleutels`.

De platen erbij:

```bash
node scripts/make-winkelplaat.mjs
```

Per product een omslag van 1600 × 900, een vierkante duimnagel van 600 × 600,
en een plaat met alle titels erop voor in de carrousel.

## Stap 2 — Een account maken

Bij Gumroad: ga naar gumroad.com, maak een account, en vul je gegevens in.
Je hebt nodig:

- Je naam en adres, letterlijk zoals ze bij de KvK staan
- Je KvK-nummer (eenmanszaak: vul die in als bedrijf)
- Je bankrekening voor de uitbetaling — de tenaamstelling moet exact kloppen
- Een identiteitsbewijs; daar vragen ze bij de eerste uitbetaling om

Zet je profiel op **Darijaforkids** met dezelfde omschrijving en hetzelfde
logo als op de socials. Een klant die van de website komt moet zien dat hij op
de goede plek is.

Zet de prijs in **€**, niet in $. Het muntmenu staat standaard op dollars.

## Stap 3 — De drie producten

Er zijn er drie, en niet zevenentwintig. Dat is een keuze: tien euro voor één
prentenboek vraagt van een ouder twaalf keer achter elkaar een afweging, en
voor vijfendertig euro is die afweging één keer.

| Product | Prijs | Sleutel in `shop.ts` | Bestand |
|---|---|---|---|
| De sleutels van Marokko | € 34,99 | `sleutelsReeks` | `sleutels-alle-delen.zip` |
| Sba de Atlasleeuw | € 34,99 | `sbaReeks` | `sba-alle-delen.zip` |
| Het e-boek | € 14,99 | `ebook` | `ebook-alle-talen.zip` |

Maak er één aan, test hem helemaal af, en pas dan de andere twee. Alles wat je
moet invullen staat in `store/winkel/producten.md`: naam, prijs, bestand, en
het tekstblok voor de beschrijving.

Kies bij *Products* **Digital product** en niet *E-book* — dat laatste is voor
één los bestand, en deze bundels zijn mappen met tientallen pdf's.

Zet de URL op iets dat je kunt uitspreken (`sleutels`, `sba`, `ebook`) vóórdat
je publiceert. Daarna verandert een link die al rondgaat kapot.

## Stap 4 — De link in de website

Open `src/site/shop.ts`. Bovenaan staat één blok `LINKS`:

```ts
const LINKS: Record<string, string> = {
  // sbaReeks: 'https://…',
  sleutelsReeks: 'https://venshipper.gumroad.com/l/sleutels',
  // ebook: 'https://…',
}
```

Haal de schuine strepen weg bij de regel die je nodig hebt en plak je adres
erin. Dan:

```bash
npm run site
git add -A
git commit -m "Sba is te koop"
git push
```

Na een paar minuten staat er op darijaforkids.eu/leesboeken **Kopen** bij die
reeks. Een product zonder link toont "Binnenkort" en geen dode knop, dus je
kunt dit per stuk doen en tussendoor uitrollen.

## Stap 5 — Zelf bestellen

Dit is de stap die niemand overslaat en die iedereen overslaat.

Koop je eigen boek. Met je eigen kaart, voor de volle prijs.

Let op:

1. Komt er **meteen** een mail, of pas na tien minuten?
2. Staat je eigen merknaam in die mail, of alleen die van de betaalpartner?
3. Werkt de downloadlink ook op een telefoon?
4. Opent de zip op een iPhone en op Android, en zitten de zes taalmappen erin?
5. Klopt de btw op de factuur voor jouw land — 21% voor Nederland?
6. Staat er een naam op je bankafschrift die een klant kan thuisbrengen?

Bij Gumroad kun je jezelf daarna terugbetalen, dus het kost je alleen de
transactiekosten. En het telt mee: voor **Gumroad Discover** heb je minstens
één verkoop nodig, en je eigen aankoop is er één.

## Stap 6 — De rest

Werk `producten.md` van boven naar beneden af. Reken op een minuut of vijf per
product, want de tekst staat er al.

Gumroad laat meerdere bestanden aan één product hangen, maar één zip is voor
een koper prettiger: die krijgt een map per taal in plaats van negentig losse
downloads. `npm run winkel` maakt die zip al, met een **LEES MIJ** erin waarin
staat dat het pdf's zijn zonder beveiliging en dat verbeterde versies gratis
zijn.

## Wat er op te letten valt

- **De prijs staat op twee plekken.** In `src/site/shop.ts` staat wat de
  bezoeker leest, in de winkel staat wat hij betaalt. Wijzig je er één, wijzig
  dan de ander. Wie op een knop van € 34,99 drukt en € 39,95 ziet, komt niet
  terug.
- **Kijk of iDEAL aanstaat.** Voor Nederlandse ouders is dat het verschil
  tussen kopen en afhaken. Staat het er niet bij, vraag het aan hun
  ondersteuning voordat je verdergaat.
- **De belofte over gratis verbeteringen moet waar blijven.** Die staat in de
  verkooptekst én in de LEES MIJ in elke zip. Wie een nieuwe versie maakt,
  stuurt hem ook naar wie al gekocht heeft; bij Gumroad gaat dat met één knop.
- **Deel 1 van De sleutels staat gratis op darijaforkids.eu.** Dat is met
  opzet: wie het uitleest wil weten hoe het verdergaat. Verandert dat boek,
  dan moet `site-assets/proefdeel/` mee — zie `scripts/make-site.mjs`.
