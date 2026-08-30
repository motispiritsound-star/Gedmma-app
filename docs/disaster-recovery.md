# Uitwijk en herstel

## Back-ups

| Onderdeel | Methode | Frequentie | Retentie |
| --- | --- | --- | --- |
| Database | Basisback-up plus continue WAL-archivering | dagelijks + continu | 35 dagen |
| Objectopslag (documenten) | Versiebeheer en replicatie | continu | 35 dagen |
| Configuratie en secrets | In de secrets manager, met eigen back-up | bij wijziging | 90 dagen |
| Infrastructuurdefinitie | In de repository | bij wijziging | volledige geschiedenis |

Eigenschappen:

* **Versleuteld**, met sleutels die apart van de back-ups worden bewaard.
* **Onveranderlijk** binnen de retentie: een aanvaller met productiecredentials
  kan de back-ups niet wissen of overschrijven.
* **Toegang beperkt** tot het herstelteam, en elke toegang wordt gelogd.
* **Buiten de productieomgeving** opgeslagen.

## Herstelprocedure

1. **Vaststellen wat er is gebeurd** en tot welk tijdstip moet worden hersteld.
   Bij een gegevensfout: het moment vlak vóór de fout. Bij een uitval: het
   laatste consistente punt.
2. **Nieuwe omgeving klaarzetten**, gescheiden van de kapotte.
3. **Basisback-up terugzetten** en de WAL afspelen tot het gekozen tijdstip.
4. **Migratiestand controleren**: draait het schema van de applicatieversie die
   je gaat starten?
5. **Integriteit controleren**:
   * balans sluit (`SELECT SUM(debet) = SUM(credit)` over alle definitieve posten);
   * hash-ketting van de audit trail is intact (`audit/controle`);
   * aantal administraties, boekingen en documenten past bij de verwachting.
6. **Verwijderings- en beperkingsregels opnieuw uitvoeren.** Dit is een
   verplichte stap: een hersteld account dat was verwijderd, mag niet
   stilzwijgend terugkomen, en een beperkte verwerking moet beperkt blijven.
7. **Objectopslag terugzetten** naar hetzelfde tijdstip en de koppeling met de
   documenten controleren (SHA-256 per document).
8. **Applicatie starten** en `/health/ready` afwachten.
9. **Verkeer omzetten.**
10. **Vastleggen**: wat is hersteld, tot welk tijdstip, wat is er mogelijk
    verloren, wie voerde het uit, en hoe lang duurde het.
11. **Klanten informeren** als er gegevens verloren zijn gegaan, met de periode
    die het betreft.

Stap 6 wordt in de praktijk het vaakst vergeten en is juridisch de belangrijkste.

## Hersteltest

Elk kwartaal wordt een volledige herstelproef gedaan naar een geïsoleerde
omgeving. Vastgelegd worden:

* datum en uitvoerder;
* het herstelpunt;
* de gemeten hersteltijd (afgezet tegen de RTO van 4 uur);
* het gemeten gegevensverlies (afgezet tegen de RPO van 15 minuten);
* de uitkomst van de integriteitscontroles;
* of stap 6 correct is uitgevoerd;
* wat er misging en welke verbeteracties eruit volgden.

Een back-up waarvan het herstel niet is getest, is geen back-up. Het compliance-
dashboard toont de datum van de laatste geslaagde hersteltest.

## Uitwijk naar een andere regio

Bij een regio-uitval:

1. Infrastructuur opbouwen in de uitwijkregio (uit de repository).
2. Back-up van de database en de objectopslag daarheen terugzetten.
3. Stappen 4 tot en met 11 van de herstelprocedure.
4. DNS omzetten.

Streeftijd: binnen de RTO van 4 uur. Dit wordt jaarlijks geoefend.
