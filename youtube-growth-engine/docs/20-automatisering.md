# 20 — Wat er vanzelf gaat, en wat niet

Status: gebouwd en getest.
Datum: 2026-09-15.

## De grens, en waarom hij daar ligt

Je vroeg om "het geautomatiseerde pushen van content". Het eerste deel daarvan
is gebouwd. Het tweede deel bouw ik niet, en dat is geen voorzichtigheid van
mij maar een regel van jou. Uit je eigen opdracht:

> "publiceer niets zonder mijn expliciete toestemming"

Daar komt bij dat volautomatisch publiceren op YouTube ook het slechtste idee
zou zijn van dit hele project. Eén verkeerde overlevering die om vier uur 's
nachts online gaat en door tienduizend mensen wordt gezien, haal je niet meer
terug. Het kanaal is dan niet beschadigd door een fout, maar door het ontbreken
van een pauzeknop.

Dus:

| | Automatisch | Jij |
|---|---|---|
| Onderwerp uit de wachtrij pakken | ✓ | |
| Onderzoek, script, titels, thumbnailconcepten | ✓ | |
| Alle poorten: originaliteit, retentie, herkomst | ✓ | |
| Stem, beeld, montage, technische controle | ✓ | |
| Bronnencheck | | reviewer |
| Goedkeuring | | jij |
| Upload naar je kanaal (**privé**) | | jij, één commando |
| Openbaar maken | | jij, in YouTube Studio |

De machine loopt tot aan de deur en klopt aan. Verder komt hij niet.

## De wachtrij

`content/wachtrij.yaml` is de volgorde waarin afleveringen gemaakt worden. Het
is gewoon een lijstje dat je zelf kunt herschikken; wat bovenaan staat, is
wat het eerst wordt gemaakt.

```bash
npm run wachtrij                             # laat zien wat er staat
npm run wachtrij -- --volgende               # maakt de eerstvolgende af
npm run wachtrij -- --toevoegen "onderwerp"  # zet er een achteraan
```

`--volgende` pakt de eerste aflevering met status `gepland`, draait de hele
productie, en zet hem daarna op `wacht-op-goedkeuring`. Daar blijft hij staan.

Twee dingen weigert hij:

- `KILL_SWITCH=true` in `.env` — alles staat stil.
- `APPROVAL_MODE=false` — dan draait hij niet. Je kunt de goedkeuringsstap dus
  niet per ongeluk wegzetten en toch doorproduceren.

Loopt een productie vast, dan blijft de aflevering op `in-productie` staan en
noemt de wachtrij hem apart. Dat is expres: een mislukking die zichzelf opruimt,
merk je pas als je je afvraagt waar je video is.

## Wekelijks vanzelf laten draaien (Windows)

Eén video per week is wat je budget aankan, dus zet de taak op één moment in de
week en laat hem daar staan. Zondagavond werkt goed: je hebt dan de hele week om
goed te keuren.

1. Start → typ **Taakplanner** → openen.
2. Rechts: **Basistaak maken**.
3. Naam: `YouTube — volgende aflevering`. Volgende.
4. **Wekelijks** → zondag, 20:00. Volgende.
5. **Een programma starten**. Volgende.
6. Invullen:
   - Programma: `powershell.exe`
   - Argumenten:
     `-NoProfile -Command "cd '$HOME\Gedmma-app\youtube-growth-engine'; npm run wachtrij -- --volgende *> productie.log"`
7. Voltooien.

De uitvoer komt in `productie.log` in de projectmap. Ging er iets mis, dan staat
het daar.

Zet in de eigenschappen van de taak ook **"Uitvoeren ongeacht of de gebruiker is
aangemeld"** aan als je wilt dat het ook draait terwijl je niet ingelogd bent.

## Wat het kost als het vanzelf draait

Hier zit het echte risico van automatisering, en het is geen technisch risico
maar een financieel. Een taak die elke week een productie start, geeft elke week
geld uit zonder dat iemand kijkt.

Twee grendels staan er al:

- `BUDGET_PER_MONTH_CENTS` in `.env` (standaard 10000, dus € 100). Bij
  overschrijding stopt de wachtrij vanzelf.
- Een uitgavelimiet bij Anthropic en bij fal.ai zelf. **Zet die.** Dat is de
  enige grendel die blijft werken als er iets in deze code stuk is.

Kijk de eerste maand na elke draai even naar de kosten die de productie
afdrukt. Klopt het beeld, dan kun je het daarna loslaten.

## Een tweede kanaal

Kan, en de gereedschappen liggen er: `npm run niches` scoort kandidaten,
`content/wachtrij.yaml` is per kanaal.

Eén waarschuwing die ik je schuldig ben. Je eerste video is nog niet uit. Een
tweede kanaal beginnen voordat het eerste iets heeft gepubliceerd, is de meest
gemaakte fout in dit vak: je verdubbelt de vaste kosten en de aandacht, terwijl
je nog niet één keer het hele proces van begin tot eind hebt doorlopen. Wat je
bij video 1 leert over wat werkt, is precies wat je bij kanaal 2 nodig hebt.

Mijn voorstel: kies het tweede kanaal nu wel, want dat kost niets, en begin met
produceren zodra video 1 online staat. De sterkste kandidaat die niet in het
gevoelige regime valt, is `ruimtevaart-nl` (78/100, laagste productiekosten van
de hele lijst) — zie `docs/18`.
