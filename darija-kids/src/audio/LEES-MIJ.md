# Opnames

Zet hier een geluidsbestand met de **id** als naam, dan spreekt de app dat
voortaan met die opname uit in plaats van met de stem van het toestel.

```
src/audio/letters/ta.wav            →  ت
src/audio/woorden/salam.wav         →  سلام
src/audio/zinnen/groeten-1-a.wav    →  die zin
```

## Waarom dit niet optioneel is

Er bestaat **geen Darija-stem**. Elke spraakmotor op elke telefoon is getraind
op Standaardarabisch — ook eentje met het label `ar-MA`. Geef zo'n motor نتا en
hij zegt "natā"; geef hem جدتي en hij zegt "jaddatī", de oma uit een schoolboek.
Klinkertekens erbij zetten helpt niet: dan wordt de klassieke lezing juist
zekerder.

Darija uit een synthesizer is dus geen kwestie van bijschaven. Het bestaat
niet. Wat hier staat is de enige weg naar een echte uitspraak, en alles zonder
opname valt terug op de stem — met de eerlijke mededeling dat je dan
Standaardarabisch hoort.

Toegestane formaten: `.webm`, `.m4a`, `.mp3`, `.ogg`, `.wav`. Er is geen lijst
om bij te werken — de map ís de lijst.

## De ids

Precies deze namen, anders wordt het bestand niet gevonden:

```
alif  ba    ta    tha   jim   ha    kha   dal   dhal  ra
zay   sin   shin  sad   dad   ta-emf za-emf ayn  ghayn fa
qaf   kaf   lam   mim   nun   ha-soft waw  ya    pa    va
ga
```

Let op de twee paren die anders heten dan je zou denken: `ta-emf` is ط (de
zware t, niet ت) en `ha-soft` is ه (de gewone h, niet ح).

## Zelf opnemen

`/opname` in de app — in de ontwikkelversie en in de demo — neemt ze één voor
één op met de microfoon, laat je terugluisteren en zet ze klaar om op te slaan.
Daar staat ook hoe ver je bent per soort.

Een ruwe opname is nooit meteen goed: `npm run add-clip opname.wav=salam --map
woorden` snijdt de stilte eromheen weg, zet alles op dezelfde sterkte en fadet
de randen, zodat twee opnames achter elkaar niet als twee verschillende
kamers klinken.

**Begin bij de letters en de eerste unit.** Achtentwintig letters en de dertig
meestgebruikte woorden dekken het grootste deel van wat een kind in de eerste
week hoort.

## Als je opnames van iemand anders gebruikt

Dan is de licentie het enige dat telt: een bestand mag pas mee in een app die
geld kost als de licentie commercieel hergebruik toestaat (CC0 en CC BY wel,
CC BY-NC niet, "geen licentie vermeld" ook niet). Zet de herkomst erbij in
`store/press-kit.md` als je materiaal van een ander gebruikt.

## Waar het op let

- **Kort en strak.** Alleen de naam van de letter, stilte ervoor en erna
  weggeknipt. De app speelt het bestand zoals het is.
- **Eén stem voor alle eenendertig.** Twee sprekers door elkaar valt meer op
  dan een synthetische stem.
- **Gewoon een telefoon is goed genoeg,** mits het stil is in de kamer.
