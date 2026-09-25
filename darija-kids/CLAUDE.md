# Voor wie hier meewerkt

## Adil werkt zelden op de Mac

Dat is geen detail, het bepaalt hoe je dingen oplevert.

**Geef een commando, geen klikpad.** Staat er ergens een stap die met de muis
in Xcode of in een ander programma moet, zoek dan eerst of het ook met één
regel in de terminal kan — en als dat kan, zet het dan in een script en hang
het aan de `npm run`-opdracht waar het thuishoort. Een stap die je met de hand
moet doen is een stap die je vergeet, en sommige van die stappen breken de app
pas bij de gebruiker.

Voorbeeld: `scripts/ios-plist.mjs` zet de twee regels in `Info.plist` die
eerst in Xcode aangeklikt moesten worden, en hangt aan `npm run ios`. Zonder de
microfoonregel sluit iOS de app af zodra een kind op de opnameknop drukt.

Kan het echt niet anders dan met de muis, zeg dat dan kort en wijs precies één
ding aan. Niet zeven genummerde stappen door een menu dat er op zijn versie
misschien anders uitziet.

## En die terminal is PowerShell 5.1

Windows PowerShell, geen bash en geen PowerShell 7. Dat betekent:

- **Geen `&&`.** Die leest hij niet als scheiding — hij zegt *"The token '&&'
  is not a valid statement separator in this version"* en doet niets. Geef
  elke opdracht op een eigen regel.
- **Geen `curl`**, dat is daar een alias voor `Invoke-WebRequest` met andere
  vlaggen. Gebruik `curl.exe`.
- **Zet de map erbij** als het ertoe doet. Hij start in zijn thuismap, en een
  `npm run` daar levert een foutmelding op over een ontbrekende
  `package.json` die niets zegt over wat er echt mis is.

En zijn bestanden hebben **`\r\n` aan het eind van elke regel**. Een script dat
in een bestand zoekt naar twee regels aan elkaar geplakt met `\n`, vindt daar
niets — en meldt dan iets heel anders dan wat er aan de hand is. Zoek per
regel, met `\r?\n` ertussen, en schrijf terug met het regeleinde dat het
bestand al had.

En **geen `/tmp`**: die map bestaat daar niet. Gebruik `tmpdir()` uit
`node:os`. Een script dat ergens een bestand neerzet en een ander script dat
het ophaalt, moeten allebei dezelfde map gebruiken — anders staat het er wel en
vindt niemand het.

En **geen `` `file://${pad}` ``**: op Windows begint een pad met `C:\`, en dan
leest een browser die `C:` als servernaam. Gebruik `pathToFileURL(pad).href`.

En in de scripts: **geen `npx` of `npm` starten met `execFileSync`.** Op Windows
heten die `npx.cmd` en `npm.cmd`, en Node vindt ze dan niet — `Error: spawnSync
npx ENOENT`, een melding waar Windows niet in voorkomt. Roep het javascript
zelf aan met `process.execPath`, zoals `scripts/lib/wrangler.mjs` doet.

## De vaste weg naar de winkels

| | |
|---|---|
| iOS | `npm run ios -- --build <n> --versie <x.y>`, dan in Xcode archiveren — zie `docs/MAC.md` |
| Android | `npm run aab -- --versie <n> --naam <x.y>` — zie `docs/ANDROID.md` |

`npm run ios` bouwt de app, kopieert hem in het iOS-project én zet de twee
regels in `Info.plist`. Sla het niet over door alleen `npx cap sync ios` te
draaien: dan bouw je de oude app in een nieuw jasje.

## Waar de stand staat

`docs/STAND.md` is het antwoord op "wat moet er nog" zonder dat je drie andere
bestanden hoeft te lezen. Verandert er iets aan de winkelstatus of aan wat
alleen Adil kan doen, dan hoort het daar bij te staan.
