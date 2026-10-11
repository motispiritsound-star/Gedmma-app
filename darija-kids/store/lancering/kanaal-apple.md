# De lanceringsdag op het kanaal — alleen Apple

`kanaal.md` is geschreven voor de dag dat 1.4 in **allebei** de winkels staat.
Die dag is er nog niet: Play beoordeelt inzending 7 sinds 3 oktober. Dit
bestand is hetzelfde bericht voor de situatie die er wél is — App Store build
10 staat op *Ready for Distribution*, Google nog niet.

Alles uit `kanaal.md` onder "Waarom het bericht zo is" en "Wat er niet in
staat" geldt hier onverkort. Wat hieronder staat is alleen wat er anders is.

## Wat er anders is, en waarom

**De openingszin kan niet "in allebei de winkels" zeggen.** Dat zou onwaar
zijn, en dit is het eerste wat de meeste lezers van de app horen.

**Android moet erin, juist nu.** `kanaal.md` zet Android bewust bovenaan omdat
de meeste mensen in het kanaal daarop zitten — zie `docs/STAND.md`. Precies
daarom kan een bericht dat alleen "download hem nu" zegt hier niet: de
meerderheid tikt, vindt niets, en de enige aankondiging die je hebt is op.

Dus staat het er eerlijk in, in één regel, **zonder datum**. Er is nog nooit
iets beloofd en vandaag is daar geen reden voor: de beoordeling loopt al vijf
werkdagen en niemand weet wanneer hij klaar is. "Zodra Google klaar is, zeg ik
het hier" is wat je waar kunt maken.

**Eén link, geen twee.** De Play-link bestaat wel als adres — hij is niets dan
de pakketnaam in een URL — maar hij wijst vandaag naar een pagina die er niet
is. Een link die 404 geeft in het eerste bericht over je app is erger dan geen
link.

**"Haal de update op" blijft staan.** 1.0 staat sinds 2 oktober stil in de App
Store; wie hem daar gevonden heeft, krijgt 1.4 via de gewone update.

---

## Het bericht

```
Hij staat er 🎉

Darijaforkids is vanaf vandaag te downloaden in de App Store, voor iPhone en
iPad. De link staat onder dit bericht.

Zit je op Android: hij ligt bij Google ter beoordeling. Zodra hij daar
doorheen is, zeg ik het hier. Een datum heb ik niet — dat bepalen zij.

Open je hem, dan begint hij met vier vragen. In welke taal je leert. Wie je
bent: je naam en een dier. Hoe je meeleest: het Arabische schrift, de klanken
in ons eigen alfabet, of allebei. En hoe het eruitziet: een kleur. Die kleur
zit daarna op je knoppen, op je voortgang en om je avatar.

Daarna beginnen de lessen. De eerste vier zijn gratis: drie stukken van het
Arabische alfabet en je eerste woorden Darija. Geen account, niets in te
vullen, geen advertenties.

Daarachter ligt de hele route. 17 units, van de letters tot afdingen op de
souq. 304 woorden en 100 zinnen. 432 opnames, allemaal ingesproken door een
Marokkaanse stem — geen computerstem. De app werkt offline, en er gaat niets
naar een server.

De uitleg staat in zes talen: Nederlands, Frans, Duits, Spaans, Italiaans en
Engels. Dus ook voor de neefjes en nichtjes over de grens.

Na die vier lessen kost de rest € 6,99 per maand, of € 59,99 per jaar met het
e-boek erbij. Drie dagen om het te proberen, en opzeggen doe je in de winkel
zelf.

Staat hij al op je toestel, haal dan de update op.

Als het je iets lijkt: stuur het door naar één familiegroep. Daar help je me
het meest mee 🇲🇦
```

## De link eronder

Eén losse regel, onder het blok. Niet erin — zie `CLAUDE.md` over een plakbaar
blok met een gat erin.

```
📱 iPhone en iPad — https://apps.apple.com/app/id6813964474
```

Dat is het korte adres, met opzet zonder landcode: apps.apple.com stuurt een
bezoeker zelf naar zijn eigen winkel, en deze app verkoopt in zes talen.
Hetzelfde adres dat `STORE.apple` in `src/site/links.ts` gebruikt.

## Korter, om door te sturen

```
Darijaforkids staat vanaf vandaag in de App Store, voor iPhone en iPad. De
eerste vier lessen zijn gratis: geen account, niets in te vullen, geen
advertenties. 17 units Marokkaans-Arabisch, van de letters tot afdingen op de
souq, ingesproken door een Marokkaanse stem — geen computerstem. Android volgt
zodra Google klaar is.
```

## Nakijken vóór je het stuurt

1. **Open het adres zelf, op een iPhone.** Niet op de Mac en niet in een
   browser op een laptop: je wilt zien wat de lezer ziet, inclusief de knop
   *Download*. Dit is hier niet na te kijken — het netwerk van de werkomgeving
   laat apps.apple.com niet door, dus deze regel is de enige controle die er
   is.
2. **Kijk of er 1.4 staat** en niet 1.0, op de pagina zelf onder *Versie*.
3. **En stuur de Play-regel niet mee.** Die komt in een eigen bericht, op de
   dag dat Google klaar is. Twee aankondigingen uit één goedkeuring is geen
   verlies maar winst: het kanaal hoort twee keer iets.

## Wat hierna komt

Als Play doorkomt, is het bericht kort — het publiek kent de app dan al:

```
En nu ook op Android 🤖

Darijaforkids staat vanaf vandaag ook in de Play Store. Alles wat in het
bericht hiervoor stond geldt daar net zo.
```

Met daaronder de Play-regel:

```
🤖 Android — https://play.google.com/store/apps/details?id=app.darijaforkids.learn
```
