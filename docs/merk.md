# Het merk

## Naam

**Mizen.** Kleine letters in het woordmerk, hoofdletter M in lopende tekst.

## Logo

Het woordmerk bestaat uit het woord en twee bogen: een boven en een onder,
gecentreerd op de `z`.

| Bestand | Waarvoor |
| --- | --- |
| `apps/web/src/ontwerp/Merk.tsx` | In de webapp. De SVG staat inline zodat de letters `currentColor` erven en dus meekleuren met het thema. |
| `apps/web/public/merk/mizen-woordmerk.svg` | Dezelfde tekening als bestand, met `currentColor`. |
| `apps/web/public/merk/mizen-woordmerk-licht.svg` | Voor een lichte achtergrond: letters in marineblauw. |
| `apps/web/public/merk/mizen-woordmerk-donker.svg` | Voor een donkere achtergrond: letters in limoen. |
| `apps/web/public/merk/mizen-beeldmerk.svg` | Vierkant, alleen de twee bogen. App-icoon en favicon. |

Waarom het beeldmerk alleen de bogen heeft: op zestien pixels is een woord
onleesbaar. Wat overblijft moet herkenbaar zijn, en dat zijn de bogen.

**De huidige tekening is een reproductie.** Hij is nagetekend en gebruikt een
geometrische schreefloze uit de systeemletters, niet het originele lettertype.
Lever je het originele bestand aan, dan is het op deze vijf plekken vervangen
en verandert er verder niets.

## Kleuren

| Naam | Waarde | Waarvoor |
| --- | --- | --- |
| Marineblauw | `#1b1b3a` | De actiekleur in de lichte modus, de grond in de donkere |
| Limoen | `#c3e84c` | De bogen in het logo, en de actiekleur in de donkere modus |

Ze staan als `--kleur-merk-blauw` en `--kleur-merk-limoen` in
`apps/web/src/stijl/tokens.css`.

### Waarom de rollen omdraaien per thema

Limoen op wit haalt 1,4 : 1. Dat is ver onder de 4,5 : 1 die WCAG 2.2 AA vraagt
voor tekst, en zelfs onder de 3 : 1 voor randen. Limoen is in de lichte modus
dus een vlak of een markering, nooit een tekstkleur; het marineblauw draagt daar
de knoppen en de links (16,6 : 1 op wit).

Op een donkere grond keert dat om: limoen haalt daar 12,9 : 1 en is juist de
best leesbare accentkleur, met het marineblauw als tekst op de knop (11,8 : 1).

| Combinatie | Contrast | Oordeel |
| --- | --- | --- |
| Tekst op grond, licht | 16,6 : 1 | ruim AA |
| Wit op de marineblauwe knop | 16,6 : 1 | ruim AA |
| Limoen op marineblauw (het logo) | 11,8 : 1 | ruim AA |
| Limoen op wit | 1,4 : 1 | **niet gebruiken voor tekst** |
| Limoen op de donkere grond | 12,9 : 1 | ruim AA |
| Marineblauw op de limoenknop | 11,8 : 1 | ruim AA |

Het toetsen is een commando, geen belofte:

```bash
npm run contrast
```

Draai dat na elke wijziging aan een kleur. Het script faalt als een combinatie
de norm niet haalt.

## Toon

De naam van het product staat zelden in beeld. In de applicatie zie je het merk
in de kop en op het aanmeldscherm, en verder niet: op een factuur staat de naam
van de ondernemer, niet die van zijn boekhoudpakket. Zonder eigen kleurkeuze
krijgt zijn factuur wel het marineblauw als accent, omdat dat neutraler is dan
een willekeurig blauw.
