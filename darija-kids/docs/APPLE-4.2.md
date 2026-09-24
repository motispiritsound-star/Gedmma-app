# Richtlijn 4.2 — wat Apple miste, en wat eraan gedaan is

Op 24 september 2026 werd versie 1.0 (build 4) afgewezen op **Guideline 4.2 —
Design: Minimum Functionality**, beoordeeld op een iPad Air van elf inch:

> The app provides a limited user experience as it is not sufficiently
> different from a web browsing experience. (…) Including features such as
> push notifications, Core Location, or sharing do not provide a robust enough
> experience to be appropriate for the App Store.

Die laatste zin is belangrijk. Er even een melding in schroeven telt niet. Wat
telt is of de app iets doet wat een browser niet kan, en of dat onderdeel is
van waar de app voor dient.

## Wat er aan de hand was

De app was een webbuild in een schil, en verder niets. Van de native laag werd
precies twee dingen gebruikt: het scherm, en de betaalplugin.

Erger: één ding dat de app belooft, werkte op een iPhone en een iPad **niet**.
De bonusronde *Spreekuur* leunt op `SpeechRecognition` uit de browser. Die
bestaat in een WKWebView niet en heeft er nooit bestaan. De ronde werd daarom
op iOS stilletjes weggelaten:

```ts
ready: (p) => p.canListen && p.words.length >= 6
```

De winkeltekst belooft *"Vijf bonusrondes die niet opraken"*. Een beoordelaar
op een iPad kreeg er vier. Dat is niet alleen richtlijn 4.2 — dat is de
beschrijving die niet klopt.

## Wat een app als deze wél van het toestel gebruikt

Er is niet in de winkel gekeken — dat kan vanaf hier niet — dus dit is wat er
bekend is van de grote taal-apps voor kinderen, en niet meer dan dat:

| Wat | Waarom het telt |
|---|---|
| Trillen bij goed en fout | Een browser op iOS kan het niet, punt. Je voelt het verschil meteen. |
| De microfoon | Een taal-app waarin je niets zegt, is een boek. |
| Een herinnering op het toestel | Een streak zonder herinnering is een streak die je vergeet. |
| Een indeling voor de iPad | Een kolom van zeshonderd pixels op elf inch ís een website. |
| Delen van wat je af hebt | Het venster van het toestel, niet een knop die een link kopieert. |
| Offline werken | Had de app al: alles zit in de build, fonts en opnames incluis. |

## Wat eraan gedaan is

1. **Trillen.** `src/engine/trilling.ts`, aangehaakt aan `sfx` zodat elke plek
   die al een geluidje maakt het meekrijgt. Goed, fout, een tik onder je
   vinger, en het einde van iets — vier momenten, niet meer, want een telefoon
   die de hele les trilt is een telefoon die je uitzet. Eigen schakelaar in de
   instellingen, want wie het geluid uitzet bedoelt daarmee niet dat het
   toestel stil moet liggen.
2. **Spreekuur werkt op iPhone en iPad.** `src/engine/microfoon.ts`. Je hoort
   hoe het hoort, je neemt jezelf op, je hoort jezelf terug. Er wordt niets
   herkend en niets goedgekeurd — dat zou niet kunnen, geen enkele motor kent
   Darija. De vlag in de bonuspool heet daarom niet meer `canListen` maar
   `canSpeak`. Vijf bonusrondes zijn er weer vijf.
3. **Meer ruimte op een breed scherm.** De rasters op Spelen, Bonus en
   Herhalen krijgen een derde kolom, en de schermen mogen tot twaalfhonderd
   punten breed worden in plaats van zevenhonderdzestig. Uitklaplijsten
   blijven twee kolommen smal: een rij die openklapt duwt anders zijn buren
   opzij.
4. **Een herinnering op het toestel.** `src/engine/herinnering.ts`. Eén melding
   per dag, op een tijd die de ouder kiest, uit tot iemand er zelf om vraagt.
   Geen server, geen token, geen pushbericht — het toestel zet een wekker.

## Wat er in Info.plist bij moet

De microfoon vraagt om een regel in `Info.plist`. Staat die er niet, dan sluit
iOS de app af op het moment dat een kind op de opnameknop drukt: geen
foutmelding, weg.

Aanklikken hoeft niet. `npm run ios` zet hem, samen met de regel over
versleuteling — zie `scripts/ios-plist.mjs` en `docs/MAC.md` C7.

## Wat er níét gebeurt

Geen account, geen iCloud, geen locatie, geen advertenties. De app belooft dat
een kind hier niets invult en dat alles op het toestel blijft, en die belofte
is meer waard dan een vinkje bij een richtlijn.
