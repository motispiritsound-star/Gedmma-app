# Opnames van de letters

Zet hier een geluidsbestand met de **id van de letter** als naam, dan spreekt
de app die letter voortaan met die opname uit in plaats van met de stem van
het toestel. Alles wat hier niet staat blijft gesynthetiseerd, dus je kunt de
set letter voor letter vullen.

```
src/audio/letters/ta.webm      →  ت wordt voortaan deze opname
src/audio/letters/qaf.m4a      →  ق ook
```

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
één op met de microfoon, laat je terugluisteren en zet ze klaar om op te
slaan. Tien minuten werk voor alle eenendertig.

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
