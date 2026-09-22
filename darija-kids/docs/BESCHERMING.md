# Zorgen dat alleen de koper het leest

Dit is een vraag waar uitgevers met veel meer geld dan wij al dertig jaar op
stuklopen, dus laat ik beginnen met wat niet werkt en waarom.

## Wat niet werkt

**Een slot op het bestand.** Versleutelde e-boeken (Adobe DRM en wat erop
lijkt) zijn er, ze kosten geld per titel, ze vereisen dat de klant een
bepaalde app installeert, en ze worden binnen een dag gekraakt. Wat je eraan
overhoudt is niet minder verspreiding maar wel meer klanten die hun eigen boek
niet open krijgen, en die mailen jou.

**Niets laten downloaden.** Alleen online lezen klinkt veilig tot je bedenkt
wat je weggooit: voorlezen op een vliegveld, printen voor aan tafel, het boek
op de tablet van oma in Marokko waar de wifi het niet doet. Voor een
prentenboek voor tweejarigen is offline geen bijzaak.

**Screenshots tegenhouden.** Kan niet. Elke telefoon heeft een knop.

Kortom: je kunt kopiëren van een bestand dat iemand heeft gekocht niet
voorkomen. Wat je wél kunt, is het onaantrekkelijk maken en de eerlijke weg
makkelijker maken dan de andere.

## Wat wel werkt

### 1. Zijn naam op elke bladzijde

Dit heet sociale drm en het is verreweg het doeltreffendst.

Onderaan elke bladzijde staat: *voor Fatima El Amrani · bestelling 1042*.

Niemand zet een boek in een appgroep van tweehonderd mensen waar zijn eigen
naam en bestelnummer op elke bladzijde staan. Niet omdat het niet kan, maar
omdat het ongemakkelijk is. Dat is genoeg.

Grote technische uitgevers doen dit al jaren en hun boeken lekken minder dan
die met een slot erop.

Het zit erin:

```bash
npm run prentenboek -- --deel 1 --voor "Fatima El Amrani · bestelling 1042"
npm run sleutels -- --deel 1 --voor "Fatima El Amrani · bestelling 1042"
```

**Bij Gumroad hoef je hier niets voor te bouwen.** Zij hebben een instelling
die de pdf bij aflevering stempelt met het mailadres van de koper. Zet die
aan; dat is één vinkje en het doet negentig procent van dit hoofdstuk.

### 2. Een link die verloopt

De downloadlink is persoonlijk, verloopt na een jaar, en mag een beperkt
aantal keer gebruikt worden. Dat regelt je betaalpartner en het staat al zo op
de afrekenpagina. Het houdt niet tegen dat iemand het bestand doorstuurt, maar
wel dat de link zelf gaat rondzwerven — en dat is in de praktijk waar de
meeste lekken beginnen.

### 3. De bundel is de bescherming

Dit is de kant die makkelijk over het hoofd wordt gezien.

Eén los deel van tien euro is iets wat je even doorstuurt. Zevenentwintig
boeken voor vijfendertig euro is een verzameling, en een verzameling koop je.
De prijs staat zo laag dat "even ergens vandaan halen" meer moeite kost dan
betalen. Dat is geen beveiliging maar het is wel de reden dat mensen het niet
doen.

### 4. Wat er niet in het bestand zit

De opnames zitten in de app en niet in het boek. Wie het pdf doorstuurt, geeft
de tekst door en niet de stem — en de stem is waar het bij deze reeks om
draait. De boeken verwijzen er ook naar: *"Wil je het horen, dan staan alle
twaalf ook in de app."*

Hetzelfde geldt voor bijgewerkte versies. Wie gekocht heeft, krijgt elke
nieuwe druk gratis via dezelfde link. Wie een doorgestuurd bestand heeft, heeft
de versie van vorig jaar.

## En als je het toch alleen op de website wilt

Dat kan, en het is te bouwen met wat er al staat — de site draait op
Cloudflare Workers, en daar hoort een eenvoudige lezer wel in te passen.

Zo zou het werken:

1. Na betaling krijgt de koper een persoonlijk adres:
   `darijaforkids.eu/lezen/#a7f3-91c2-...`
2. Dat adres opent een lezer in de browser. Geen account, geen wachtwoord —
   de code ís de sleutel.
3. De bladzijden komen als afbeelding van de server, niet als pdf.
4. Gaat een code rond, dan zie je dat aan het gebruik en kun je hem intrekken
   en de koper een nieuwe geven.

Wat het kost: een dag of twee bouwen, en daarna een dienst die draait en die
stuk kan. Wat het oplevert: minder doorsturen van bestanden, meer mails van
mensen bij wie het niet werkt.

**Mijn advies: doe dit niet als eerste.** Begin met de naam op elke bladzijde
en een verlopende link. Dat is vanavond klaar. Zie je over een half jaar dat
je boeken ergens rondgaan waar ze niet horen, dan bouwen we de lezer erbij —
dan weet je tenminste dat het probleem echt bestaat.

## Wat ik zou doen

| | |
| --- | --- |
| **Nu** | Pdf-stempeling aanzetten bij de betaalpartner. Eén vinkje. |
| **Nu** | Downloadlink één jaar geldig, beperkt aantal keren. Staat al ingesteld. |
| **Nu** | In de mail bij de bestelling: "dit exemplaar is van jou, met je naam erin". Mensen die weten dat het erin staat, sturen het niet door. |
| **Later** | De lezer op de website, als blijkt dat het nodig is. |
| **Nooit** | Een slot op het bestand. |
