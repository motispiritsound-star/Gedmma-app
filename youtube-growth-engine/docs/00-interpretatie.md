# 00 — Mijn interpretatie van het project

## In één zin

Je wilt een **redactie in software**: een systeem dat de rol van eindredacteur,
onderzoeker, scriptschrijver, producer en analist automatiseert, met jou als
hoofdredacteur die publicatie goedkeurt — niet een videofabriek die zoveel
mogelijk uploads perst.

## Wat je feitelijk vraagt

Drie dingen die vaak door elkaar lopen, maar hier duidelijk gescheiden zijn:

1. **Een analyse-instrument.** Referentievideo's en -kanalen worden ontleed op
   *abstracte* patronen: welke publieksvraag ligt eronder, welke belofte doet de
   titel, waar zakt het tempo in. De output is inzicht, geen materiaal.
2. **Een productiepipeline.** Van originele stelling tot gemonteerde video met
   ondertiteling, thumbnail en metadata — met kwaliteitspoorten die publicatie
   kunnen tegenhouden.
3. **Een leerlus.** YouTube Analytics voedt hypotheses terug in het systeem,
   waarbij elke hypothese één variabele isoleert.

De pipeline is het makkelijkste deel. De poorten en de leerlus zijn waar het
project staat of valt.

## Wat ik als kern van je opdracht lees

Je hebt het scherpste punt zelf al benoemd: **automatisering verlaagt
productiekosten, maar koopt geen aandacht.** Het systeem is daarom expliciet
ontworpen om *minder* te produceren dan het technisch kan. De poorten zijn geen
formaliteit maar de belangrijkste functie: ze mogen, en moeten, video's
tegenhouden.

Dat heeft één ontwerpgevolg dat door alles heen loopt: **een afgewezen video is
een succesvolle systeemuitkomst, geen fout.** Het dashboard, de logging, de
kostenregistratie en de wekelijkse rapportage behandelen afwijzingen daarom als
normale, meetbare output — niet als incidenten.

## Wat dit systeem uitdrukkelijk niet is

| Niet | Wel |
|---|---|
| Een "faceless channel"-generator | Een redactie met een controleerbare eigen stelling per video |
| Een herschrijver van succesvolle scripts | Een analysator van publieksvragen achter succesvolle scripts |
| Een sjabloon waarin het onderwerp wordt vervangen | Een systeem dat sjabloonherkenning zelf als afkeuringsgrond gebruikt |
| Een publicatieschema-vuller | Een systeem dat liever niets publiceert dan iets zwaks |
| Een groeihack-tool | Automatische engagement is nergens in de architectuur mogelijk gemaakt |

## De vier aannames waar ik op bouw

1. **Menselijke goedkeuring blijft.** `APPROVAL_MODE=true` is de standaard, en
   voor gevoelige onderwerpen (gezondheid, financiën, recht, politiek,
   veiligheid) blijft volautomatisch publiceren uitgeschakeld, ook nadat je de
   modus globaal uitzet.
2. **Providers zijn vervangbaar.** Elke externe dienst zit achter een adapter
   met een eigen contract, zodat een leverancier die duurder, slechter of
   juridisch onhoudbaar wordt, in een dag te vervangen is.
3. **Geen enkel bestand van een andere maker komt het systeem binnen.** Het
   systeem haalt uitsluitend metadata en statistieken op via de officiële API.
   Er wordt niets gedownload, geen video, geen thumbnail, geen audiospoor.
4. **Winst is een hypothese, geen belofte.** Het model rekent met bandbreedtes
   en toont scenario's. Nergens staat een verwachte opbrengst als vaststaand
   bedrag.

## Wat mij in jouw uitgangspositie opvalt

Deze repository bevat **Buurklus** — een Nederlandse marktplaats die
huishoudens aan vakmensen koppelt. Als het kanaal bij dat bedrijf hoort,
verandert dat de economie van het hele plan ingrijpend:

- Advertentie-inkomsten via het YouTube Partner Program vragen eerst 1.000
  abonnees én 4.000 kijkuren (zie [`02`](02-niche-en-businessmodel.md)). Dat is
  maanden werk vóór de eerste euro.
- Een kanaal dat vraag naar je eigen dienst opwekt, hoeft die drempel **niet**
  te halen om rendabel te zijn. Eén nieuwe vakman of één afgesloten klus per
  1.000 views kan meer waard zijn dan de advertentie-RPM van de hele niche.

Dat is geen aanname die ik voor je maak — het is vraag 10 in
[`01-vragen.md`](01-vragen.md). Maar het is wel de vraag met de grootste
financiële hefboom van de tien.
