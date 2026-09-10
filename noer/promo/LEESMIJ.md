# De promofilm

Drie dingen liggen hier:

| | |
|---|---|
| `DRAAIBOEK.md` | Het draaiboek: scène voor scène, met de teksten, de boodschap aan ouders, de nasheed-tekst en een muziekbriefing. |
| `promo.html` | De film, afspeelbaar in de browser. |
| `nasheed.mp3` | Staat er nog niet. Zet je hem hier neer, dan loopt de film mee met de muziek. |

## Bekijken

Dubbelklik op `promo.html`. Spatiebalk speelt en pauzeert, **f** gaat naar
volledig scherm. De film duurt 1 minuut en 22 seconden.

## Er een videobestand van maken

De film is opgenomen met een browser die zichzelf filmt. Dat kun je herhalen:

```bash
node ../../tools/film-opnemen.js                 # liggend, 1280x720
node ../../tools/film-opnemen.js --staand        # staand, 720x1280
```

Of doe het met de hand: open `promo.html?kaal=1` in volledig scherm en start
een schermopname. `?kaal=1` verbergt de bediening, `?staand=1` maakt er een
staand beeld van voor sociale media.

## De muziek erbij

Zet een `nasheed.mp3` naast `promo.html`. De film volgt dan de tijd van de
muziek in plaats van zijn eigen klok, dus beeld en zang lopen gelijk. Zorg dat
de opname ongeveer 82 seconden duurt; de tekst en de opbouw staan in het
draaiboek.

Let op: dit werkt alleen als de pagina via een server geopend wordt (`npm start`
in de map erboven, dan `http://localhost:5173/…`). Bij dubbelklikken staat de
browser het lezen van buurbestanden niet toe, en speelt de film zonder geluid.

## Aanpassen

Alles zit in `promo.html`. De tijdlijn staat bovenin het script:

```js
const SCENES = [
  { id: 'fitrah',  van: 0,  tot: 10 },
  { id: 'leerde',  van: 10, tot: 24 },
  ...
];
```

Elk element in een scène heeft `data-na` (na hoeveel seconden het verschijnt)
en soms `data-uit` (wanneer het weer verdwijnt), geteld vanaf het begin van die
scène. Wil je een zin langer laten staan, verzet dan één getal.

Voor een korte versie voor sociale media: houd scène 1, de vraag uit scène 2,
scène 3 en scène 7. Dat is ongeveer 30 seconden.

## Voor je hem uitgeeft

In de film staan drie religieuze teksten en één aya. Laat ze nakijken; zie de
laatste paragraaf van `DRAAIBOEK.md`.
