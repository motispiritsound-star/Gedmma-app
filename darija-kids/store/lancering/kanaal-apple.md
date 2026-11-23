# De lanceringsdag op het kanaal — alleen Apple

`kanaal.md` is geschreven voor de dag dat 1.4 in **allebei** de winkels staat.
Die dag is er nog niet: Apple heeft 1.4 goedgekeurd, Google beoordeelt nog —
`docs/STAND.md`. Dit bestand is hetzelfde bericht voor de situatie die er wél
is: App Store build 10 staat op *Ready for Distribution*, Google nog niet.

Alles uit `kanaal.md` onder "Waarom het bericht zo is" en "Wat er niet in
staat" geldt hier onverkort. Wat hieronder staat is alleen wat er anders is.

**Wat hieronder over geld staat, is van 23 november.** Er zijn geen gratis
lessen meer en geen proefperiode: de app is gratis te downloaden, de cursus is
een abonnement, en dat wordt op het eerste scherm gevraagd. Na het betalen gaat
alles in één keer open. Op het jaar loopt een tijdelijke actie van 50%. De
onderbouwing staat boven `magLeren` in `src/engine/store.ts`; wat er in de
consoles moet staat in `docs/STAND.md`. Dezelfde regels gelden in
`store/lancering/mail.md` en `store/lancering/socials.md`, en elke regel over
geld in dit bestand is daarop nagekeken.

## Wat er anders is, en waarom

**De openingszin kan niet "in allebei de winkels" zeggen.** Dat zou onwaar
zijn, en dit is het eerste wat de meeste lezers van de app horen.

**Android moet erin, juist nu.** `kanaal.md` zet Android bewust bovenaan omdat
de meeste mensen in het kanaal daarop zitten — zie `docs/STAND.md`. Precies
daarom kan een bericht dat alleen "download hem nu" zegt hier niet: de
meerderheid tikt, vindt niets, en de enige aankondiging die je hebt is op.

Dus staat het er eerlijk in, in één regel, **zonder datum**. Er is nog nooit
iets beloofd en vandaag is daar geen reden voor: niemand weet wanneer de
beoordeling klaar is. "Zodra Google klaar is, zeg ik het hier" is wat je waar
kunt maken.

**Eén link, geen twee.** De Play-link bestaat wel als adres — hij is niets dan
de pakketnaam in een URL — maar hij wijst vandaag naar een pagina die er niet
is. Een link die 404 geeft in het eerste bericht over je app is erger dan geen
link.

**De prijs staat in dit bericht, en kan er niet meer uit.** `kanaal.md` legt
onder "Waarom het bericht zo is" uit dat de prijsregel daar een beslissing was:
hoort ze op T-2, dan kan ze hier weg. Dat is sinds 23 november voorbij. De
cursus is een abonnement en dat is het eerste wat de app vraagt, dus een
aankondiging zonder prijs stuurt iemand naar een betaalscherm waar hij niet op
gerekend had. En een aankondiging die "gratis" zegt terwijl de winkel bij het
afsluiten afschrijft, is bij Apple richtlijn **2.3.1** — die geldt woordelijk
*"whether within or outside of the App Store"*, dus ook voor een bericht in een
WhatsApp-kanaal.

**"Haal de update op" blijft staan, nu met één zin erbij.** 1.0 staat sinds
2 oktober stil in de App Store; wie hem daar gevonden heeft, krijgt 1.4 via de
gewone update. In 1.0 waren er nog gratis lessen, dus die lezer heeft er
mogelijk een paar afgerond — en die houdt hij, precies die en niets erbij,
omdat `magLeren` aan `isDone` hangt in plaats van aan een lijst. Eén zin
daarover hoort erbij: wie hem niet leest, denkt dat de update hem iets heeft
afgenomen, en dat is het soort misverstand dat je terugleest in een
beoordeling.

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

Downloaden is gratis: geen account, niets in te vullen, geen advertenties. De
cursus zelf is een abonnement, en dat vraagt hij meteen daarna. Betaal je, dan
gaat alles in één keer open — geen porties.

En dan ligt de hele route voor je. 17 units, van de letters tot afdingen op de
souq. 304 woorden en 100 zinnen. 432 opnames, allemaal ingesproken door een
Marokkaanse stem — geen computerstem. De app werkt offline, en er gaat niets
naar een server.

De uitleg staat in zes talen: Nederlands, Frans, Duits, Spaans, Italiaans en
Engels. Dus ook voor de neefjes en nichtjes over de grens.

€ 59,99 per jaar met het e-boek erbij, of € 6,99 per maand. En nu de helft van
de jaarprijs: € 29,99 voor het eerste jaar (€ 2,50 per maand) in plaats van
€ 59,99. Tijdelijk, tot [EINDDATUM]. Opzeggen doe je in de winkel zelf.

Staat hij al op je toestel, haal dan de update op. Wat je al had afgerond,
blijft open staan.

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
Darijaforkids staat vanaf vandaag in de App Store, voor iPhone en iPad. Gratis
te downloaden; de cursus is een abonnement, en het eerste jaar is nu de helft:
€ 29,99 (€ 2,50 per maand) in plaats van € 59,99. 17 units
Marokkaans-Arabisch, van de letters tot afdingen op de souq, ingesproken door
een Marokkaanse stem — geen computerstem. Geen account, geen advertenties.
Android volgt zodra Google klaar is.
```

Het bedrag dat werkelijk wordt afgeschreven staat vooraan en de omrekening
tussen haakjes erachter. Nooit andersom en nooit alleen: Apple wees 1.0 af op
richtlijn **3.1.2(c)** omdat de omgerekende maandprijs duidelijker stond dan
het bedrag dat van de rekening gaat.

## Nakijken vóór je het stuurt

1. **De actie van € 29,99 staat werkelijk in App Store Connect.** Dit is de
   eerste regel omdat het bericht die prijs noemt. Wat je waar zet staat in
   `docs/STAND.md` onder *23 november: de tijdelijke actie van 50% op het
   jaar*. Staat de aanbieding er nog niet, dan gaat de hele actieregel eruit en
   noem je alleen € 59,99 per jaar of € 6,99 per maand. Controleer het op het
   aankoopvenster zelf, op een telefoon, in de app uit de winkel: de console
   zegt wat er ingesteld is, niet wat de koper leest.
2. **`[EINDDATUM]` is vervangen.** Eén treffer, in de prijsregel. Dezelfde
   datum als de einddatum die je in de console hebt gezet — een actie zonder
   einddatum is bij Apple gewoon de nieuwe prijs, en in een aankondiging een
   bewering die je niet kunt onderbouwen. Is de datum nog niet gekozen, haal
   dan "Tijdelijk, tot [EINDDATUM]." weg en laat de rest staan; de zin blijft
   dan waar. Blokhaken worden meegeplakt.
3. **De proefperiode van drie dagen staat uit**, bij beide abonnementen. In
   App Store Connect is dat de regel *Free for the first 3 days* onder
   **Introductory Offers**. Bij `app.darijaforkids.yearly` doet de actie uit
   stap 1 dat in één handeling, want er geldt één introductieaanbieding per
   abonnement per land en een nieuwe overschrijft de bestaande; bij
   `app.darijaforkids.monthly` moet hij apart uit. Zie `docs/STAND.md`. Dit
   bericht noemt geen gratis dagen, dus zolang de winkel ze wél geeft, zegt
   het bericht iets anders dan het aankoopvenster.
4. **Open het adres zelf, op een iPhone.** Niet op de Mac en niet in een
   browser op een laptop: je wilt zien wat de lezer ziet, inclusief de knop
   *Download*. Dit is hier niet na te kijken — het netwerk van de werkomgeving
   laat apps.apple.com niet door, dus deze regel is de enige controle die er
   is.
5. **Kijk of er 1.4 staat** en niet 1.0, op de pagina zelf onder *Versie*.
6. **En stuur de Play-regel niet mee.** Die komt in een eigen bericht, op de
   dag dat Google klaar is. Twee aankondigingen uit één goedkeuring is geen
   verlies maar winst: het kanaal hoort twee keer iets.

## Wat hierna komt

Als Play doorkomt, is het bericht kort — het publiek kent de app dan al:

```
En nu ook op Android 🤖

Darijaforkids staat vanaf vandaag ook in de Play Store. Alles wat in het
bericht hiervoor stond geldt daar net zo, de prijs inbegrepen.
```

Met daaronder de Play-regel:

```
🤖 Android — https://play.google.com/store/apps/details?id=app.darijaforkids.learn
```

Twee voorwaarden aan die laatste vier woorden. De actie van € 29,99 moet op
dat moment óók in **Play Console** staan, bij `app.darijaforkids.yearly` →
basisplan `jaar` — zet je hem alleen bij Apple, dan belooft dit bericht een
prijs die de Play Store niet rekent. En is de actie voorbij of loopt ze nog
maar kort, dan gaat "de prijs inbegrepen" eruit en noem je in dit tweede
bericht niets over geld: een lezer die hierop afkomt en € 59,99 aantreft,
leest het eerste bericht als een belofte die niet is nagekomen.
