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

Dit zet alle zevenentwintig boeken in `store/winkel/` en schrijft ernaast
`producten.md`: per boek de titel, de prijs, het bestand en de tekst voor de
productpagina.

Duurt een paar minuten. Laat het draaien.

## Stap 2 — Een account maken

Bij Gumroad: ga naar gumroad.com, maak een account, en vul je gegevens in.
Je hebt nodig:

- Je naam en adres
- Je KvK-nummer (je hebt een eenmanszaak, dus vul die in als bedrijf)
- Je bankrekening of PayPal voor de uitbetaling
- Een identiteitsbewijs — ze vragen er bij de eerste uitbetaling om

Zet je profiel op **Darijaforkids** met dezelfde omschrijving en hetzelfde
logo als op de socials. Een klant die van de website komt moet zien dat hij op
de goede plek is.

## Stap 3 — Het eerste product

Begin met één. Test hem helemaal af voordat je de andere zesentwintig maakt.

Neem **Sba deel 1**. Open `store/winkel/producten.md` en zoek het blok
*Sba de Atlasleeuw — deel 1*. Daar staat alles wat je moet invullen:

- **Naam**: zoals het er staat
- **Prijs**: € 9,99
- **Bestand**: `store/winkel/sba-deel-01.pdf`
- **Omschrijving**: het blok tekst tussen de streepjes
- **Omslag**: de eerste bladzijde van de pdf, of `site-assets/boeken/sba.webp`

Zet het product op **gepubliceerd**. Je krijgt een adres terug dat er
ongeveer zo uitziet:

```
https://darijaforkids.gumroad.com/l/sba1
```

## Stap 4 — De link in de website

Open `src/site/shop.ts`. Bovenaan staat een blok `LINKS` met alles
uitgecommentarieerd. Haal de schuine strepen weg bij de regel die je nodig
hebt en plak je adres erin:

```ts
const LINKS: Record<string, string> = {
  sba1: 'https://darijaforkids.gumroad.com/l/sba1',
}
```

De sleutel (`sba1`) staat in `producten.md` bij elk boek onder *Sleutel in
shop.ts*. Haal je hem door elkaar, dan verkoopt de knop van deel 3 het boek
van deel 1 — daarom staat hij erbij.

Dan:

```bash
npm run site
git add -A
git commit -m "Deel 1 van Sba is te koop"
git push
```

Na een paar minuten staat het op darijaforkids.eu/leesboeken. Bij deel 1 staat
nu **Kopen**; bij de rest nog **Binnenkort**.

## Stap 5 — Zelf bestellen

Dit is de stap die niemand overslaat en die iedereen overslaat.

Koop je eigen boek. Met je eigen kaart, voor de volle prijs.

Let op:

1. Komt er **meteen** een mail, of pas na tien minuten?
2. Staat je eigen naam of merknaam in die mail, of alleen die van de
   betaalpartner?
3. Werkt de downloadlink ook op een telefoon?
4. Is de pdf te openen in de standaard-app van een iPhone en een Android?
5. Klopt de btw op de factuur voor jouw land?
6. Staat er een naam op je bankafschrift die een klant kan thuisbrengen?

Bij de meeste partijen kun je jezelf daarna terugbetalen, dus het kost je
alleen de transactiekosten.

Werkt dit allemaal, dan pas maak je de andere zesentwintig producten aan.

## Stap 6 — De rest

Werk `producten.md` van boven naar beneden af. Reken op een minuut of drie per
product.

Zet daarna de twee bundels erbij. Kan je partij meerdere bestanden aan één
product hangen, dan doe je dat; kan het niet, maak dan een zip:

```bash
cd store/winkel
zip sba-alle-delen.zip sba-deel-*.pdf
zip sleutels-alle-delen.zip sleutels-deel-*.pdf
```

## Wat er nog niet klopt en wat je eraan doet

- **De prijzen staan op twee plekken.** In `src/site/shop.ts` staat wat de
  bezoeker leest, in de winkel staat wat hij betaalt. Wijzig je er één, wijzig
  dan de ander. Een bezoeker die op een knop van € 9,99 drukt en € 12,95 ziet,
  komt niet terug.
- **De boeken zijn nog niet af.** De delen 7 tot en met 15 van De sleutels
  halen de beloofde honderd bladzijden nog niet. Verkoop die pas als ze er
  staan, of zet ze erbij met de vermelding dat er gratis bijgewerkte versies
  komen — dat mag, en het staat al zo op de afrekenpagina.
- **De vertalingen ontbreken.** Op de afrekenpagina staat dat je alle zes de
  talen krijgt. Dat is nu nog niet waar: de boeken zijn in het Nederlands.
  Verkoop tot die tijd alleen de Nederlandse versie en haal die belofte van de
  afrekenpagina, of maak eerst de vertalingen.
