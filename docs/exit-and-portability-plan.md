# Exit en overdraagbaarheid

## Uitgangspunt

Een boekhouding is van de ondernemer, niet van de leverancier. Wie wil
vertrekken, moet dat kunnen doen zonder te onderhandelen, zonder te betalen voor
zijn eigen gegevens en zonder een formaat te krijgen dat alleen Gedmma kan
lezen. Dat is ook de kant van [migration-strategy.md](migration-strategy.md) die
naar buiten wijst: overstappen mag nooit op techniek stuklopen, in beide
richtingen.

Dit document beschrijft drie dingen: wat er vandaag te halen valt, welke
exportbundel er nog moet komen, en welke procedure er geldt als een klant
opzegt of als de exploitant zelf wegvalt.

## Ontwerpregels

1. **Geen gijzeling.** Exporteren kan zolang de administratie bestaat, ook
   tijdens een betaalgeschil en ook nadat het abonnement is opgezegd.
2. **Open formaten.** JSON en CSV voor gegevens, PDF voor documenten, UBL 2.1
   voor facturen. Geen eigen binair formaat.
3. **Volledig, niet samengevat.** De export bevat de journaalregels zelf, niet
   alleen rapporten die eruit zijn afgeleid. Wie de regels heeft, kan elk
   rapport opnieuw maken.
4. **Zelf te controleren.** Bij de export hoort een overzicht met aantallen en
   totalen, zodat de ontvanger kan vaststellen dat er niets ontbreekt.
5. **Geen extra kosten en geen vertraging** die het overstappen feitelijk
   belemmeren. Dit is bewust ontworpen met het oog op hoofdstuk VI van de
   Europese Data Act; zie rij C-30 in de
   [compliancematrix](compliance-matrix.md).

## Wat er vandaag al kan

| Wat | Hoe | Formaat |
| --- | --- | --- |
| Alle grootboekmutaties | `GET /administraties/:id/rapporten/journaal` met paginering | JSON |
| Saldi per rekening | `GET .../rapporten/saldibalans` | JSON |
| Balans en winst-en-verliesrekening | `GET .../rapporten/balans`, `.../winst-en-verlies` | JSON |
| Btw- en ICP-overzichten per periode | `GET .../rapporten/btw`, `.../rapporten/icp` | JSON |
| Ouderdomsanalyse debiteuren en crediteuren | `GET .../rapporten/ouderdomsanalyse` | JSON |
| Verkoopfacturen | `GET .../verkoopfacturen` en per stuk `/pdf` en `/ubl` | JSON, PDF, UBL 2.1 |
| Inkoopfacturen | `GET .../inkoopfacturen` | JSON |
| Bonnen en bijlagen | `GET .../documenten` en `/documenten/:id/inhoud` | oorspronkelijk bestand |
| Relaties | `GET .../relaties` | JSON |
| Bankrekeningen en transacties | `GET .../bankrekeningen`, `.../banktransacties` | JSON |
| Auditspoor | `GET .../audit` en `GET .../audit/controle` | JSON |

Deze endpoints staan beschreven in [api.md](api.md) en in het
OpenAPI-document. Ze zijn met een gewoon API-token te benaderen; er is geen
aparte, duurdere "exportkoppeling".

Voor de exploitant is er daarnaast de databaseroute: een `pg_dump` per
administratie, beschreven in [disaster-recovery.md](disaster-recovery.md). Die
is bedoeld voor herstel, niet voor overdracht aan een klant, omdat het formaat
alleen bruikbaar is voor wie dezelfde software draait.

## Wat er nog niet is

**Er is nog geen knop "exporteer mijn hele administratie".** Vandaag moet de
export via de API worden samengesteld. Voor een ondernemer zonder technische
hulp is dat te veel gevraagd, en daarmee is de belofte hierboven nog niet
waargemaakt. Dit is een openstaand punt, geen afgeronde functie.

De bundel die er moet komen, ligt vast in deze specificatie zodat er later niets
te interpreteren valt:

```
export-<administratie>-<datum>.zip
  manifest.json          formaatversie, administratie, periode, tijdstip,
                         aantallen en totalen per bestand, hash per bestand
  grootboekrekeningen.csv
  journaalposten.csv     kop van elke boeking
  journaalregels.csv     debet en credit per regel, met de post als sleutel
  relaties.csv
  verkoopfacturen.csv    met regels in verkoopfactuurregels.csv
  inkoopfacturen.csv     met regels in inkoopfactuurregels.csv
  banktransacties.csv
  btw-aangiften.csv
  auditspoor.csv         inclusief de hashketen, zodat de ontvanger kan
                         controleren dat er niets is gewijzigd
  documenten/            de oorspronkelijke bestanden, met de naam uit
                         manifest.json gekoppeld aan de boeking
  facturen/              PDF en UBL per verkoopfactuur
  LEESMIJ.md             wat elk bestand betekent en hoe de sleutels lopen
```

Eisen aan die bundel:

- Bedragen staan als decimale tekst in de export, nooit als getal met een
  drijvende komma. Dat is dezelfde regel die in de hele codebasis geldt
  (ADR-006 in [decision-log.md](decision-log.md)).
- De export draait als achtergrondtaak in de bestaande takenwachtrij, zodat een
  administratie van jaren de webserver niet blokkeert.
- Het aanmaken en het downloaden van een export zijn allebei gebeurtenissen in
  het auditspoor (`administratie.geexporteerd`). Wie de gegevens van een
  administratie meeneemt, is daarmee altijd herleidbaar.
- De downloadlink is tijdelijk en aan de gebruiker gebonden.
- Een export bevat alleen de administraties waarvoor de gebruiker rechten heeft;
  de row-level security geldt ook hier, zonder uitzondering.

Zie [roadmap.md](roadmap.md) voor de fasering.

## Procedure bij opzegging

Deze procedure sluit aan op de stappen in
[data-retention-policy.md](data-retention-policy.md).

| Stap | Wat | Termijn |
| --- | --- | --- |
| 1 | Opzegging bevestigd; de administratie gaat op **alleen lezen** en gaat niet dicht | direct |
| 2 | De klant kan de volledige export aanmaken en downloaden | tijdens de hele overgangsperiode |
| 3 | De klant controleert de export aan de hand van `manifest.json` en meldt wat ontbreekt | binnen de overgangsperiode |
| 4 | Herstel van wat ontbreekt, kosteloos | binnen 5 werkdagen na de melding |
| 5 | Expliciete bevestiging door de klant dat hij alles heeft | vóór het einde van de overgangsperiode |
| 6 | Verwijdering, met inachtneming van de fiscale bewaarplicht en van eerder ingediende verwijderings- of beperkingsverzoeken | na stap 5 |
| 7 | Verwijderverklaring aan de klant: wat is verwijderd, wanneer, en wat om welke wettelijke reden is bewaard | binnen 10 werkdagen na stap 6 |

De duur van de overgangsperiode is een contractuele afspraak van de exploitant
en staat bewust niet in de code. Zolang die afspraak er niet is, is de
uitgangswaarde in [data-retention-policy.md](data-retention-policy.md) leidend.

Twee dingen die hier expliciet **niet** gebeuren:

- De administratie wordt bij opzegging niet ontoegankelijk gemaakt. Een
  ondernemer die zijn boekhouding wettelijk moet kunnen tonen, mag daar niet
  buiten kunnen komen doordat een incasso is mislukt.
- Er wordt niet stilzwijgend verwijderd. Verwijderen gebeurt na een bevestiging
  en levert een verklaring op.

## Als de exploitant zelf wegvalt

Dit scenario staat ook in [business-continuity.md](business-continuity.md). Het
plan bestaat uit drie lagen, omdat elke laag afzonderlijk kan falen:

1. **De klant heeft zijn eigen export.** Daarom moet de exportbundel er komen en
   moet hij zonder hulp van de exploitant te maken zijn. Klanten wordt
   aangeraden periodiek te exporteren; dat advies hoort in het product zelf
   thuis.
2. **De software is te draaien door een ander.** Gedmma draait op PostgreSQL en
   Node zonder eigen infrastructuurdiensten die alleen bij deze exploitant
   bestaan. De installatie staat volledig beschreven in
   [deployment.md](deployment.md), inclusief `docker-compose.yml` en de
   migraties. Een andere partij kan een dump terugzetten en verder draaien.
3. **Het formaat is leesbaar zonder de software.** CSV met een LEESMIJ en een
   manifest is ook over tien jaar te openen. Dat is de reden dat de export geen
   eigen formaat gebruikt.

Wat de exploitant hiervoor moet regelen en wat niet in software kan zitten: een
escrow- of doorstartafspraak, en de vraag wie de gegevens beheert als de
exploitant er niet meer is. Dat is een contractueel punt en het staat als
openstaand risico in de [compliancematrix](compliance-matrix.md).

## Overdraagbaarheid voor betrokkenen

Het recht op dataportabiliteit uit artikel 20 AVG ligt bij een natuurlijke
persoon en gaat over zijn eigen persoonsgegevens, niet over de administratie van
een onderneming. In de praktijk lopen die twee door elkaar, bijvoorbeeld bij een
eenmanszaak. De afhandeling staat in
[data-subject-rights-procedure.md](data-subject-rights-procedure.md); dit
document gaat over de overdracht van de administratie als geheel.

## Wat hier niet wordt beweerd

Dit plan is een ontwerp van het ontwikkelteam. Of het voldoet aan hoofdstuk VI
van de Data Act, aan artikel 20 AVG of aan de bewaarverplichtingen, is niet
juridisch getoetst. De toets staat als openstaande actie in de
[compliancematrix](compliance-matrix.md) en in het
[bronnenregister](legal-source-register.md) (rij L17).
