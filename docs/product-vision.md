# Productvisie

## Het probleem

Een ondernemer wil weten of het goed gaat en of hij op tijd zijn belasting
betaalt. In plaats daarvan krijgt hij grootboekrekeningen, btw-codes,
dagboeken en een jaarrekening waar hij niets van begrijpt. Boekhoudsoftware is
historisch gebouwd voor de boekhouder en daarna aan de ondernemer verkocht.

## De belofte

**Gedmma voert de administratie uit; de ondernemer bevestigt.**

Iemand zonder boekhoudkennis moet in Gedmma een volledige, juiste en
controleerbare administratie kunnen voeren, en op elk moment in gewone taal
kunnen zien hoe zijn bedrijf ervoor staat. De boekhoudkundige juistheid is
daarbij niet onderhandelbaar: onder de begrijpelijke buitenkant zit een strikte
dubbele boekhouding met een volledige audit trail.

## Vier productprincipes

### 1. Gewone taal boven vakjargon
Elk scherm zegt eerst wat het betekent, daarna pas hoe het heet.
"Nog te ontvangen van klanten: EUR 12.430" staat groot; "Debiteuren (1300)"
staat als toelichting eronder. De vaktaal verdwijnt niet — een boekhouder moet
het product ook kunnen gebruiken — maar hij is nooit de enige uitleg.

### 2. Niets zonder herleidbaarheid
Elk getal in elk rapport is doorklikbaar tot de journaalpost, en van daar tot
het brondocument. Een saldo dat je niet kunt uitleggen, is in dit product een
fout. Deze eis geldt vanaf de MVP en is als test vastgelegd
(`rapportage sluit exact aan op grootboek`).

### 3. Voorstellen, geen automatische besluiten
Automatisering is de kern van het product, maar de machine boekt niet zelf
definitief. Regels en AI doen een voorstel met een motivatie en een
betrouwbaarheidsscore; een bevoegde gebruiker bevestigt. Wie automatisch wil
laten boeken, zet dat expliciet aan per regel, per grens en per soort.

### 4. Geen slot op de deur
De volledige administratie is op elk moment machineleesbaar te exporteren,
inclusief documenten. Overstappen naar een ander pakket mag nooit op techniek
stuklopen. Dit is zowel een productprincipe als een verplichting onder de
Europese Data Act.

## Doelgroepen

| Doelgroep | Belangrijkste behoefte | Kernfunctie |
| --- | --- | --- |
| Zzp'er / eenmanszaak | "Klopt het en wat moet ik betalen?" | Bonnen fotograferen, factuur sturen, btw zien |
| Vof | Zelfde, plus verdeling tussen vennoten | Kapitaalrekeningen per vennoot |
| Bv | Correcte jaarcijfers, loonkoppeling, dga | Volledig rekeningschema, jaarafsluiting |
| Holding en werkmaatschappij | Zicht op de groep | Meerdere administraties, consolidatie (F4) |
| Stichting | Verantwoording aan bestuur en subsidiegever | Kostenplaatsen, projectverantwoording, ANBI-rapport (F4) |
| Vereniging | Contributies en kascommissie | Periodieke facturatie, ledenadministratie via relaties |
| Mkb (5-100 medewerkers) | Grip op werkkapitaal | Ouderdomsanalyse, liquiditeitsprognose, budget vs. werkelijk |
| Accountant / boekhouder | Veel administraties, weinig tijd | Accountantsportaal met status en reviewworkflow (F4) |
| Medewerker met beperkte rechten | Alleen zijn eigen taak | Fijnmazige rechten, functiescheiding |
| Externe adviseur | Tijdelijke, beperkte inzage | Toegang op uitnodiging, met einddatum en logging |

## Positionering ten opzichte van de benchmark

SnelStart is de functionele maatstaf: alles wat een Nederlandse ondernemer daar
kan, moet uiteindelijk in Gedmma kunnen. Het onderscheid zit in zes punten die
door de hele roadmap heen meetbaar zijn gemaakt:

| Punt | Meetbaar gemaakt als |
| --- | --- |
| Begrijpelijkheid | Elke financiële term in de UI heeft een uitleg; getoetst in de a11y- en tekstreview |
| Automatisering | Percentage banktransacties dat zonder handmatige actie correct wordt geboekt |
| Snelheid | Performancebudgetten per scherm (p95) en per API-endpoint, gemeten in CI |
| Rapportage | Elk rapporttotaal doorklikbaar tot document; afgedwongen door een test |
| Mobiel | Volwaardige app, niet een verpakte website (fase 3) |
| Samenwerking | Accountant werkt in dezelfde administratie zonder wachtwoorddeling (fase 4) |

## Wat Gedmma nadrukkelijk niet is

* Geen bank of betaaldienstverlener. Betalingen lopen via vergunninghoudende
  partijen; Gedmma bereidt voor en registreert.
* Geen fiscaal adviseur. Het product rekent, signaleert en legt uit, en zegt
  erbij wanneer een accountant of fiscalist moet meekijken.
* Geen zwarte doos. Elke automatische stap is achteraf uit te leggen en terug
  te draaien via een correctieboeking.
