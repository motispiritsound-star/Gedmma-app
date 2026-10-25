# Video en beeldmateriaal

Vier films, allemaal reproduceerbaar uit deze repository. Drie zijn echte
schermopnames van de draaiende app; de vierde is een geanimeerde uitleg.

**Wat hier niet staat, en waarom.** Er is geen beeld van een kind met een doos.
Dat product bestaat nog niet, en beeldmateriaal dat eruitziet als opnames van
een bestaand product zou je niet kunnen gebruiken zonder je publiek te
misleiden. Het draaiboek onderaan is wat een cameraploeg nodig heeft zodra er
prototypes op tafel liggen.

---

## Opnieuw maken

```bash
npm run db:seed          # de films gaan uit van de geseede staat
npm run dev              # in een tweede terminal
npm run video            # schermopnames + uitleg, beide talen
```

Uitvoer in `marketing/video/`, als WebM en MP4 (H.264, 25 fps, 1280×720).
De map staat in `.gitignore`: het zijn gegenereerde bestanden, geen bron.

| Bestand | Duur | Wat het toont |
| --- | --- | --- |
| `01-ouder-bestelt` | 0:22 | Catalogus, veiligheid op de verkooppagina, bestellen, betalen in testmodus |
| `02-kind-luistert` | 0:35 | Een hoofdstuk: fout antwoord → hint, langzamer, en de oudersamenvatting |
| `03-redactie-keurt` | 0:22 | AI-concept aanvragen, en de goedkeuringswachtrij |
| `04-uitleg-nl` / `-en` | 0:36 | Geanimeerde uitleg in vier stappen |

De uitleg is een bronbestand: `marketing/explainer.html`. Openen in een browser
speelt hem af; `?lang=en` schakelt de taal om. Teksten aanpassen doe je daar,
niet in de video.

---

## Voice-over

Getimed op de opnames. Nederlands is de leidende versie; de Engelse loopt op
dezelfde markers.

### 01 — Ouder bestelt · 0:22

| Tijd | Beeld | NL | EN |
| --- | --- | --- | --- |
| 0:00 | Homepage | Elke maand een doos vol ontdekken. | A box of discovery every month. |
| 0:04 | Catalogus | Per thema, per leeftijd. Ruimte, natuur, elektriciteit. | By theme, by age. Space, nature, electricity. |
| 0:09 | Veiligheidsblok | De waarschuwingen staan er vóór je koopt, niet pas als de doos openligt. | The warnings are there before you buy, not once the box is open. |
| 0:15 | Betaalscherm | Bestellen duurt een minuut. | Ordering takes a minute. |
| 0:19 | Bevestiging | En dan is het wachten op de post. | And then you wait for the post. |

### 02 — Kind luistert · 0:35

Dit is de belangrijkste film. **Laat de stilte staan**: de seconden waarin er
niets gezegd wordt zijn precies het punt.

| Tijd | Beeld | NL | EN |
| --- | --- | --- | --- |
| 0:00 | Dozen | Je kind kiest een doos en een hoofdstuk. | Your child picks a box and a chapter. |
| 0:06 | Maatje start | Vanaf hier mag het scherm omgedraaid op tafel. | From here the screen can lie face down. |
| 0:12 | Langzamer | Te snel? Eén knop, en het gaat rustiger. | Too fast? One button, and it slows down. |
| 0:17 | Fout antwoord | Een fout antwoord is geen fout. Het is een andere route. | A wrong answer is not a failure. It is a different route. |
| 0:22 | Hint | Er komt een hint, en het verhaal gaat gewoon door. | A hint comes, and the story simply carries on. |
| 0:28 | Samenvatting | En jij ziet wat er gedaan is. Geen cijfers. | And you see what was done. No grades. |

### 03 — Redactie keurt · 0:22

Voor investeerders, scholen en pers — iedereen die vraagt hoe je AI en
kinderen bij elkaar houdt.

| Tijd | Beeld | NL | EN |
| --- | --- | --- | --- |
| 0:00 | Studio | Alles wat een kind hoort is vooraf geschreven. | Everything a child hears is written in advance. |
| 0:05 | AI-concept | Een redacteur mag AI gebruiken om te schrijven. | An editor may use AI to write. |
| 0:11 | DRAFT-label | Wat eruit komt is een concept. Niets meer. | What comes out is a draft. Nothing more. |
| 0:16 | Wachtrij | Een tweede mens keurt het goed, of niet. Pas dan hoort een kind het. | A second person approves it, or does not. Only then does a child hear it. |

### 04 — Geanimeerde uitleg · 0:36

| Tijd | Scene | NL | EN |
| --- | --- | --- | --- |
| 0:01 | Doos gaat open | Elke maand komt er een doos. Materialen, proefkaarten en een verhaal. | A box arrives every month. Materials, cards and a story. |
| 0:08 | Code | Eén korte code in het deksel koppelt hem aan jullie gezin. | One short code inside the lid ties it to your family. |
| 0:15 | Golfvorm | Het maatje leest voor, stelt een vraag… | The companion reads along, asks a question… |
| 0:20 | Golf vlak | …en houdt zijn mond terwijl je kind aan het bouwen is. | …and stays quiet while your child is building. |
| 0:26 | Samenvatting | Jij ziet wat er gedaan is. Geen cijfers, geen niveaus. | You see what was done. No grades, no levels. |
| 0:31 | Eindkaart | WonderBox. Ontdekken met je handen, begeleid door je oren. | WonderBox. Discover with your hands, guided by your ears. |

**Toon.** Rustig, laag tempo, geen uitroeptekens. Het product verkoopt zichzelf
op het feit dat het níét schreeuwt; de voice-over moet dat niet tegenspreken.
Muziek mag, maar zacht en zonder percussie onder scene 3 — de stilte daar moet
hoorbaar stil zijn.

---

## Draaiboek voor een echte opname

Zodra er prototypes zijn. Eén draaidag, twee locaties.

### Wat je nodig hebt

- Drie complete dozen, dichtgeplakt en met een gedrukte code in het deksel.
- Twee kinderen per leeftijdsgroep (5–8 en 9–12), met schriftelijke toestemming
  van beide ouders voor gebruik in marketing, met een intrekbare termijn.
- Een gewone huiskamer- of keukentafel. Geen studio-decor: het hoort er thuis
  uit te zien.
- Daglicht van opzij, één zachte bijlamp. Geen hard licht op het gezicht.

### Shotlist

| # | Shot | Waarom |
| --- | --- | --- |
| 1 | Doos op de deurmat, van bovenaf | Het moment dat het begint |
| 2 | Handen die de doos openen, close-up | Materiaal en kwaliteit |
| 3 | Kind leest de code op, ouder typt hem in | Laat zien dat de ouder de setup doet |
| 4 | Kind luistert, kijkt weg van het scherm | Het hele verhaal in één beeld |
| 5 | Handen die de ballonraket vastplakken | Het echte werk |
| 6 | De raket schiet langs het touw, slow motion | De beloning |
| 7 | Kind drukt op "nog een keer" | De meest gebruikte knop |
| 8 | Ouder en kind praten na aan tafel | Waar het voor bedoeld is |
| 9 | Statisch: de doos, de kaarten, het gemaakte proefje | Voor stills en socialformaten |

### Regieaanwijzingen

- **Niet regisseren wat het kind zegt.** Laat ze het proefje echt doen en film
  wat er gebeurt. Als het misgaat, is dat de beste opname die je die dag maakt.
- **Film de pauzes.** De verleiding is om elke stilte weg te knippen. Precies
  die stiltes zijn het product.
- **Geen enkel shot waarin het kind naar een scherm staart.** Als dat in beeld
  komt, verkoop je het tegenovergestelde van wat je bouwt.
- **Toon een volwassene bij alles met gips, batterijen of de deurpost.** Dat is
  wat de doos zelf ook zegt.
