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
2. *(volgt)* **Spreekuur werkt op iPhone en iPad.**
3. *(volgt)* **Een indeling voor de iPad.**
4. *(volgt)* **Een herinnering op het toestel**, achter de ouderpoort.

## Wat er níét gebeurt

Geen account, geen iCloud, geen locatie, geen advertenties. De app belooft dat
een kind hier niets invult en dat alles op het toestel blijft, en die belofte
is meer waard dan een vinkje bij een richtlijn.
