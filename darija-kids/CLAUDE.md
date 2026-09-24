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

## De vaste weg naar de winkels

| | |
|---|---|
| iOS | `npm run ios`, dan in Xcode archiveren — zie `docs/MAC.md` |
| Android | `npm run aab -- --versie <n> --naam <x.y>` — zie `docs/ANDROID.md` |

`npm run ios` bouwt de app, kopieert hem in het iOS-project én zet de twee
regels in `Info.plist`. Sla het niet over door alleen `npx cap sync ios` te
draaien: dan bouw je de oude app in een nieuw jasje.

## Waar de stand staat

`docs/STAND.md` is het antwoord op "wat moet er nog" zonder dat je drie andere
bestanden hoeft te lezen. Verandert er iets aan de winkelstatus of aan wat
alleen Adil kan doen, dan hoort het daar bij te staan.
