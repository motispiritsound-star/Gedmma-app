# Beveiligingsincidenten

Een beveiligingsincident is breder dan een datalek: een storing door een aanval,
een kwetsbaarheid in een afhankelijkheid of een verloren laptop is een incident,
ook zonder dat er persoonsgegevens zijn gelekt. Raakt het incident
persoonsgegevens, dan geldt daarnaast de
[datalekprocedure](data-breach-procedure.md).

## Ernst

| Niveau | Betekenis | Reactietijd | Voorbeeld |
| --- | --- | --- | --- |
| P1 | Actieve inbreuk of dienst onbereikbaar | direct, 24/7 | Ongeautoriseerde toegang tot de database |
| P2 | Ernstige kwetsbaarheid of gedeeltelijke uitval | binnen 4 uur | Kritieke kwetsbaarheid in een afhankelijkheid die uitbuitbaar is |
| P3 | Beperkt risico | binnen 1 werkdag | Kwetsbaarheid zonder bekend exploitatiepad |
| P4 | Verbeterpunt | volgende sprint | Melding uit een scan zonder direct risico |

## Verloop

1. **Melden** bij het interne meldpunt. Iedereen mag en moet melden; twijfel is
   een reden om te melden, niet om te wachten.
2. **Triage**: ernst bepalen en een incidentleider aanwijzen. Die leidt, de rest
   voert uit.
3. **Beheersen**: verspreiding stoppen. Sessies intrekken, sleutels roteren,
   toegang dichtzetten, zo nodig de dienst tijdelijk beperken.
4. **Bewijs veiligstellen** vóór herstel: logs, geheugenopnames en configuratie.
   Herstellen wist sporen.
5. **Onderzoeken**: wat is er gebeurd, sinds wanneer, welke systemen en gegevens,
   en hoe kon het.
6. **Herstellen**: oplossen, controleren dat het weg is, en pas dan opschalen.
7. **Communiceren**: klanten informeren wanneer het hen raakt; bij
   persoonsgegevens volgt de datalekprocedure.
8. **Evalueren**: binnen twee weken een evaluatie zonder schuldvraag, met
   verbeteracties, eigenaren en termijnen. Die acties worden gevolgd tot ze af zijn.

## Rollen

| Rol | Verantwoordelijkheid |
| --- | --- |
| Incidentleider | Coördineert, besluit over opschalen, bewaakt de tijdlijn |
| Technisch onderzoeker | Beheersen, onderzoeken, herstellen |
| Communicatie | Klanten, medewerkers en zo nodig de buitenwereld |
| Privacyverantwoordelijke | Beoordeelt of het ook een datalek is |
| Juridisch | Meldplichten, contractuele gevolgen |

## Responsible disclosure

Er is een `security.txt` met een meldadres en een publieke sleutel. Melders
krijgen binnen drie werkdagen antwoord, een indicatie van de planning en
erkenning bij oplossing. Er wordt niet juridisch opgetreden tegen onderzoekers
die zich aan het beleid houden: geen gegevens van anderen inzien of downloaden,
geen dienst verstoren, en niet publiceren voordat het is opgelost.

## Kwetsbaarhedenbeheer

| Bron | Frequentie | Afhandeling |
| --- | --- | --- |
| `npm audit` in CI | elke push | Hoog en kritiek blokkeert de build |
| Container scan | elke build | Hoog en kritiek blokkeert de build |
| Statische analyse | elke push | Bevindingen worden beoordeeld |
| Secret scanning | elke push | Een gevonden geheim wordt direct geroteerd |
| Penetratietest | jaarlijks en vóór productie | Bevindingen als tickets met eigenaar en termijn |

Streeftermijnen: kritiek binnen 7 dagen, hoog binnen 30 dagen, midden binnen 90
dagen, laag bij de eerstvolgende gelegenheid.
