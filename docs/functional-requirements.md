# Functionele eisen

Prioriteit: **M** = MVP (fase 1), **F2**-**F5** = latere fase. Elke eis is
geformuleerd als iets dat een gebruiker kan doen of dat het systeem garandeert.

## 1. Toegang en organisatie

| # | Eis | Prio |
| --- | --- | --- |
| T-01 | Registreren met e-mail en wachtwoord; e-mailadres wordt geverifieerd | M |
| T-02 | Inloggen met wachtwoord, daarna met TOTP als MFA aanstaat | M |
| T-03 | MFA instellen met QR-code en tien eenmalige herstelcodes | M |
| T-04 | Actieve sessies inzien en intrekken | M |
| T-05 | Organisatie aanmaken met naam, rechtsvorm, KVK- en btw-nummer | M |
| T-06 | Administratie aanmaken met boekjaar, valuta en rekeningschema-sjabloon | M |
| T-07 | Wisselen tussen administraties zonder opnieuw in te loggen, met zichtbare bevestiging welke administratie actief is | M |
| T-08 | Gebruikers uitnodigen met een rol; uitnodiging verloopt | M |
| T-09 | Toegang per administratie beperken, met einddatum voor externe adviseurs | M |
| T-10 | Passkeys (WebAuthn) als tweede factor of als inlogmethode | F2 |
| T-11 | Enterprise SSO via OIDC/SAML, gebruikersinrichting via SCIM | F4 |
| T-12 | Support-impersonatie met toestemming, tijdslimiet, melding en logging | F2 |

## 2. Boekhoudkundige kern

| # | Eis | Prio |
| --- | --- | --- |
| B-01 | Elke financiële gebeurtenis leidt tot een journaalpost waarvan debet en credit exact gelijk zijn | M |
| B-02 | Concept-, definitieve en gestorneerde posten zijn te onderscheiden | M |
| B-03 | Een definitieve post is onveranderbaar; corrigeren gebeurt met een tegenboeking die naar het origineel verwijst | M |
| B-04 | Boekjaren met vrije begin- en einddatum (gebroken boekjaar) | M |
| B-05 | Perioden kunnen worden geblokkeerd en gesloten; heropenen vereist een apart recht en een motivatie | M |
| B-06 | Documentnummers zijn per dagboek, per jaar uniek en opeenvolgend | M |
| B-07 | Memoriaalboekingen handmatig invoeren | M |
| B-08 | Openingsbalans invoeren of importeren | M |
| B-09 | Vreemde valuta per regel, met koers en koersverschilboeking | M |
| B-10 | Afrondings- en betalingsverschillen als expliciete regel, binnen een instelbare tolerantie | M |
| B-11 | Kostenplaatsen en kostendragers per regel | F2 |
| B-12 | Accruals en transitorische posten met automatische tegenboeking in de volgende periode | F2 |
| B-13 | Herwaardering van vreemde valuta op balansdatum | F2 |
| B-14 | Boekjaar afsluiten met winstbestemming en automatische beginbalans | F4 |

## 3. Rekeningschema

| # | Eis | Prio |
| --- | --- | --- |
| R-01 | Sjablonen voor zzp/eenmanszaak, bv, stichting en vereniging | M |
| R-02 | Rekeningen toevoegen, hernoemen en blokkeren (nooit verwijderen als er op is geboekt) | M |
| R-03 | Standaard btw-code per rekening | M |
| R-04 | RGS-code per rekening als optioneel veld | M (veld) / F4 (volledige mapping) |
| R-05 | Rekeningen groeperen voor de balans en de winst-en-verliesrekening | M |

## 4. Relatiebeheer

| # | Eis | Prio |
| --- | --- | --- |
| C-01 | Klanten en leveranciers vastleggen, met meerdere adressen en contactpersonen | M |
| C-02 | Btw-nummer, KVK-nummer, IBAN, betalingstermijn en kredietlimiet | M |
| C-03 | Dubbele relaties worden gesignaleerd bij invoer | M |
| C-04 | Import en export via CSV | M |
| C-05 | Notities, documenten, tags, taken en communicatiegeschiedenis | F2 |
| C-06 | KVK-, VIES- en adresvalidatie achter adapters | F2 |

## 5. Verkoop

| # | Eis | Prio |
| --- | --- | --- |
| V-01 | Offerte maken, versturen en omzetten naar factuur | M |
| V-02 | Conceptfactuur maken met meerdere regels, btw-codes en kortingen | M |
| V-03 | Factuur definitief maken: nummer toekennen, boeken, onveranderbaar | M |
| V-04 | PDF genereren met eigen logo en huisstijl | M |
| V-05 | Factuur per e-mail versturen met PDF en UBL-bijlage | M |
| V-06 | Creditnota maken, ook op basis van een bestaande factuur | M |
| V-07 | Btw-verlegd, intracommunautaire levering en 0%-tarief | M |
| V-08 | Vreemde valuta | M |
| V-09 | Validatie van de wettelijke factuurvereisten vóór definitief maken | M |
| V-10 | Openstaande posten en ouderdomsanalyse | M |
| V-11 | Periodieke facturen en abonnementen | F2 |
| V-12 | Verzamel-, termijn-, voorschot- en pro-formafacturen | F2 |
| V-13 | Automatische herinneringen en aanmaningen met instelbaar schema | F2 |
| V-14 | Betaalverzoek met QR-code via een betaalprovider | F3 |
| V-15 | Verzending via Peppol | F3 |
| V-16 | Betalingsregelingen en incassostatus | F4 |

## 6. Inkoop en documenten

| # | Eis | Prio |
| --- | --- | --- |
| I-01 | Inkoopfactuur registreren met leverancier, datum, regels en btw | M |
| I-02 | Document uploaden (pdf, jpg, png, heic) en aan de factuur koppelen | M |
| I-03 | Origineel document blijft ongewijzigd bewaard; elke bewerking wordt geregistreerd | M |
| I-04 | Dubbele leveranciersfacturen worden geweigerd op leverancier + factuurnummer | M |
| I-05 | Documentarchief met zoeken en filteren | M |
| I-06 | Ontbrekende bonnen signaleren op basis van banktransacties zonder document | M |
| I-07 | Uploaden per e-mail naar een uniek adres per administratie | F2 |
| I-08 | OCR: leverancier, datum, bedrag, btw, factuurnummer, IBAN en factuurregels | F2 |
| I-09 | Automatische grootboek- en btw-voorstellen met motivatie | F2 |
| I-10 | Goedkeuringsworkflow met meerdere stappen | F2 |
| I-11 | Terugkerende leveranciersfacturen herkennen | F2 |
| I-12 | Matching met bestelling en ontvangst | F4 |

## 7. Bankieren

| # | Eis | Prio |
| --- | --- | --- |
| K-01 | Meerdere bankrekeningen per administratie, elk gekoppeld aan een grootboekrekening | M |
| K-02 | Import van CSV, MT940 en CAMT.053 | M |
| K-03 | Dubbele transacties worden herkend en overgeslagen | M |
| K-04 | Automatische matching met openstaande facturen op bedrag, kenmerk en IBAN | M |
| K-05 | Handmatig koppelen, ook gedeeltelijk en aan meerdere facturen | M |
| K-06 | Boekingsregels: voorwaarde leidt tot grootboekrekening en btw-code | M |
| K-07 | Transactie splitsen over meerdere rekeningen | M |
| K-08 | Interne overboekingen tussen eigen rekeningen herkennen | M |
| K-09 | Bankreconciliatie: eindsaldo afschrift versus grootboeksaldo, met verschillenlijst | M |
| K-10 | Signaleren van ontbrekende transacties (gat in de afschriftnummering) | M |
| K-11 | PSD2-synchronisatie via een vergunninghoudende provider | F3 |
| K-12 | Creditcards en betaalproviders (PayPal, Mollie, Stripe) | F3 |
| K-13 | SEPA-betaalbestand (pain.001) met functiescheiding bij goedkeuring | F3 |

## 8. Uren en projecten

| # | Eis | Prio |
| --- | --- | --- |
| U-01 | Project aanmaken met klant, uurtarief of vaste prijs, budget en periode | M |
| U-02 | Activiteiten binnen een project, met een eigen tarief per activiteit | M |
| U-03 | Uren schrijven in minuten, met omschrijving en factureerbaarheid | M |
| U-04 | Het tarief wordt vastgelegd zoals het gold op het moment van schrijven | M |
| U-05 | Uren indienen, goedkeuren en afkeuren; niemand keurt zijn eigen uren goed | M |
| U-06 | Een gewijzigd uur verliest zijn goedkeuring | M |
| U-07 | Wie geen recht heeft op andermans uren, ziet en wijzigt alleen de eigen uren | M |
| U-08 | Goedgekeurde uren omzetten in een conceptfactuur, per activiteit en tarief gegroepeerd | M |
| U-09 | Een gefactureerd uur is niet meer te wijzigen of te verwijderen | M |
| U-10 | Projectoverzicht: geschreven, te factureren, gefactureerd en budgetbewaking | M |
| U-11 | Urenstaat per week met een snelinvoer per dag | F2 |
| U-12 | Kilometers en declaraties, met dezelfde goedkeuringsweg | F2 |
| U-13 | Timer die meeloopt tijdens het werk | F2 |
| U-14 | Resultaat per project: omzet tegenover kosten en uren | F2 |
| U-15 | Vaste prijs met termijnen en een voortgangspercentage | F3 |

## 9. Btw en belastingen

| # | Eis | Prio |
| --- | --- | --- |
| A-01 | Nederlandse btw-codes met tarief, geldigheidsperiode en aangiftevak | M |
| A-02 | Btw-overzicht per periode met bedragen per vak | M |
| A-03 | Btw-aansluiting: het overzicht sluit exact aan op de grootboekrekeningen | M |
| A-04 | Waarschuwing bij inconsistenties (btw op een rekening zonder btw-code, ontbrekend btw-nummer bij een IC-levering) | M |
| A-05 | Export van het overzicht naar CSV voor de adviseur | M |
| A-06 | ICP-opgave per btw-identificatienummer | F2 |
| A-07 | Suppletie met verschillenoverzicht | F2 |
| A-08 | Privégebruik en correctieboekingen | F2 |
| A-09 | OSS voor afstandsverkopen | F4 |
| A-10 | Aangifte indienen via SBR/Digipoort | F4 |
| A-11 | Audit trail van aangiften: wie diende wat wanneer in, met welke cijfers | F2 |

Bij elke fiscale uitkomst toont de interface dat het een berekening is en geen
belastingadvies, met de vermelding dat controle door een accountant of fiscalist
nodig kan zijn.

## 10. Rapportages

| # | Rapport | Prio |
| --- | --- | --- |
| P-01 | Balans | M |
| P-02 | Winst-en-verliesrekening | M |
| P-03 | Proef- en saldibalans | M |
| P-04 | Grootboekkaart per rekening | M |
| P-05 | Journaal (alle posten chronologisch) | M |
| P-06 | Debiteuren- en crediteurenlijst | M |
| P-07 | Ouderdomsanalyse | M |
| P-08 | Btw-overzicht | M |
| P-09 | Vergelijking met de vorige periode | M |
| P-10 | Cashflowoverzicht en liquiditeitsprognose | F2 |
| P-11 | Omzet per klant, per product; kosten per leverancier | F2 |
| P-12 | Resultaat per project en per kostenplaats | F2 |
| P-13 | Budget versus werkelijkheid | F2 |
| P-14 | Consolidatie over administraties | F4 |

Alle rapporten zijn filterbaar op periode, doorklikbaar tot de journaalpost en
het document, en exporteerbaar naar CSV en PDF (Excel in fase 2).

## 11. Dashboard

| # | Eis | Prio |
| --- | --- | --- |
| D-01 | Omzet, kosten, winst en banksaldo over de gekozen periode | M |
| D-02 | Openstaande debiteuren en crediteuren | M |
| D-03 | Verwachte btw voor de lopende aangifteperiode | M |
| D-04 | Facturen die aandacht nodig hebben (vervallen, bijna vervallen) | M |
| D-05 | Banktransacties die nog geboekt moeten worden | M |
| D-06 | Ontbrekende bonnen | M |
| D-07 | Aankomende deadlines | M |
| D-08 | Vergelijking met de vorige periode | M |
| D-09 | Cashflowgrafiek en liquiditeitsprognose | F2 |
| D-10 | Budget versus werkelijkheid | F2 |
| D-11 | Afwijkende transacties gesignaleerd | F2 |
| D-12 | Door AI voorgestelde acties | F2 |
| D-13 | Widgets aanpassen en herschikken | F2 |

## 12. Import, export en migratie

| # | Eis | Prio |
| --- | --- | --- |
| M-01 | Volledige machineleesbare export van een administratie (JSON + CSV + documenten) | M |
| M-02 | Import van relaties, rekeningschema en openingsbalans via CSV | M |
| M-03 | Importwizard met kolommapping, voorbeeldweergave, validatie en foutmeldingen | F2 |
| M-04 | Dry run, rollback, deduplicatie, importlog en aansluitingsrapport | F2 |
| M-05 | Import van UBL, MT940, CAMT en auditfiles | M (bank) / F2 (rest) |
| M-06 | Generieke migratieadapters per bronpakket | F2 |

## 13. Abonnementen en commercie

| # | Eis | Prio |
| --- | --- | --- |
| S-01 | Abonnementsvormen: Starter, ZZP, MKB, Professional, Accountant, Enterprise | M (model) |
| S-02 | Proefperiode, maand- en jaarabonnement | F3 |
| S-03 | Gebruikers-, administratie- en opslaglimieten met feature flags | M (handhaving) |
| S-04 | Upgrades, downgrades, add-ons en coupons | F3 |
| S-05 | Read-onlymodus na beëindiging, met veilige export en grace period | M |
| S-06 | Facturering via een betaalprovider achter een adapter | F3 |

## 14. Privacy en compliance in het product

| # | Eis | Prio |
| --- | --- | --- |
| G-01 | Privacy request center voor verzoeken van betrokkenen | M |
| G-02 | Bewaartermijnen per documentsoort, met legal hold | M |
| G-03 | Auditlog inzien en exporteren voor bevoegde rollen | M |
| G-04 | Cookie- en trackingkeuzes; standaard alles uit behalve noodzakelijk | M |
| G-05 | Verwerkersovereenkomst per tenant registreren (versie, datum, tekenbevoegde) | M |
| G-06 | Subverwerkersregister zichtbaar voor klanten, met wijzigingsmelding | M |
| G-07 | Incident- en datalekregister | M |
| G-08 | Compliance-dashboard voor interne beheerders | F4 |
