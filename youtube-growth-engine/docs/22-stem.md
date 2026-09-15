# 22 — De stem

Status: keuze gemaakt, gereedschap gebouwd. Eén ding moet jij doen.
Datum: 2026-09-15.

## Wat ik wel en niet kan

Ik kan niet horen. Ik kan lezen wat vergelijkers zeggen, ik kan de kosten
uitrekenen en ik kan het veld terugbrengen van twintig aanbieders naar drie.
De laatste stap — welke van die drie klinkt goed — is van jou, en dat is geen
beleefdheid: een stem die jij niet wilt horen, houd je geen jaar vol.

Wat ik heb gedaan om die stap zo klein mogelijk te maken staat onderaan.

## Het volume, want dat beslist

NL-001 is 1049 gesproken woorden, ongeveer **6.500 tekens**. Eén video per week
is grofweg **26.000 tekens per maand**. Met hernemingen en een Short erbij:
zeg **40.000**.

Dat getal is klein. Veel kleiner dan waar de prijslijsten op zijn gebouwd, en
dat verandert de vergelijking volledig:

| | Gratis per maand | Kost bij 40.000 tekens |
|---|---|---|
| **Google Chirp 3: HD** | 1.000.000 tekens | **€ 0** |
| **Azure Neural** | 500.000 tekens | **€ 0** |
| ElevenLabs Creator | — | **± € 20 per maand, altijd** |

ElevenLabs kost een vast bedrag, ongeacht of je één video maakt of veertig. Op
jouw volume is dat **een vijfde van je maandbudget** voor iets wat twee
concurrenten gratis doen.

Dat is geen argument tegen ElevenLabs. Het is een argument dat ElevenLabs
duidelijk beter moet klínken om het waard te zijn — en dat moet je horen, niet
aannemen.

## Mijn keuze voor dit kanaal

**Google Chirp 3: HD, Nederlands (nl-NL).**

Waarom, in volgorde van gewicht:

1. **Gratis op jouw volume**, met een factor veertig marge. Je kunt een video
   tien keer opnieuw inspreken zonder ergens aan te komen.
2. **Nieuwste generatie.** Chirp 3 is Googles huidige model en ondersteunt
   Nederlands.
3. **Het past bij dit kanaal.** Dit is een uitlegkanaal over infrastructuur.
   Wat je nodig hebt is helderheid en een rustige, gezaghebbende mededeling.
   Expressiviteit — waar ElevenLabs in uitblinkt — is hier geen voordeel maar
   een risico: een stem die dramatiseert over gemalen, klinkt onserieus.

**Tweede keuze: Azure, `nl-NL-MaartenNeural`.** Ook gratis op dit volume, en
Azures Nederlandse stemmen zijn getraind óp Nederlands in plaats van meertalig
met Nederlands erbij. Dat scheelt soms hoorbaar bij plaatsnamen.

**ElevenLabs bewaar ik voor kanaal 1.** Daar vroeg je om een filmische stem, en
daar draagt de stem het verhaal in plaats van de uitleg te ondersteunen. Die
twintig euro is op dát kanaal verdedigbaar en op dit kanaal niet.

Let op: alle kwaliteitsuitspraken hierboven komen uit vergelijkingsartikelen,
niet uit mijn eigen oren. **Bron B.** Daarom de test hieronder.

## De test, en waarom hij anders is dan de gebruikelijke

```bash
npm run stemtest
```

Elke aanbieder heeft een demotekst die is uitgekozen om goed te klinken: korte
zinnen, gewone woorden, geen cijfers. Daarmee klinkt alles goed.

Dit commando leest je eigen script, zoekt het aaneengesloten stuk met de meeste
struikelwoorden erin, en zet dat klaar om te plakken. Voor NL-001 komt daar dit
uit:

> Aan het eind van het Noordzeekanaal, bij IJmuiden, staat het grootste gemaal
> van Europa. Het verzet ongeveer tweehonderdzestig kubieke meter water per
> seconde. (…) Een olympisch zwembad bevat vijfentwintighonderd kubieke meter.

Dat is precies de passage waar een stem op stuk gaat: twee plaatsnamen, twee
getallen die voluit geschreven staan, en een leenwoord. Het commando zegt er
ook bij waaróm elk woord lastig is.

Het schrijft twee bestanden:

- `out/stemtest/passage.txt` — plakken in de demo van alle drie.
- `out/stemtest/scoreblad.md` — invullen terwijl je luistert, niet achteraf.

Waar je op let staat in dat scoreblad, maar één punt hoort hier ook:
**luister de hele passage uit.** Veel stemmen klinken de eerste tien seconden
prima en gaan daarna dreunen. Jouw video's duren acht minuten.

En de laatste test, de enige die echt telt: laat de winnaar horen aan iemand
die niet weet dat het een computer is. Vraag wat diegene van de verteller
vond. Gaat het antwoord over de **inhoud**, dan is de stem goed. Gaat het over
de **stem**, dan niet.

## Als je gekozen hebt

In `.env`:

```bash
TTS_API_KEY=...
TTS_VOICE_ID=...
```

Eén ding om te weten voordat je Google of Azure kiest: de adapter in dit
project is geschreven voor ElevenLabs, omdat die tijdstempels per teken
teruggeeft waaruit de ondertiteling rechtstreeks volgt. Kies je Google of
Azure, dan moet ik daar een adapter voor schrijven — een half uur werk, en de
ondertiteling komt dan uit de scripttiming in plaats van uit de audio. Zeg het
zodra je gekozen hebt, dan bouw ik hem.

## Bronnen

- ElevenLabs prijzen 2026 (Creator $22/maand) — secundaire vergelijkingen (B)
- Azure Speech prijzen: 500K gratis, $16/1M neural — secundair (B)
- Google Cloud TTS: Chirp 3 HD $30/1M, 1M gratis, nl-NL ondersteund — secundair (B)
- Azure Nederlandse stemmen Colette, Fenna, Maarten — secundair (B)

Geen van deze pagina's kon ik zelf openen; alles komt uit zoekresultaten.
Controleer de prijzen bij het aanmaken van je account — dat is het moment
waarop je ze toch ziet.
