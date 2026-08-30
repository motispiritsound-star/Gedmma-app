# Register van verwerkingsactiviteiten

Dit register hoort bij artikel 30 AVG. Het is opgesteld vanuit het ontwerp van
het product; de exploitant vult het aan met zijn eigen bedrijfsvoering
(personeel, boekhouding, leveranciers) en laat het juridisch toetsen.

Voor de rolverdeling, rechtsgronden en bewaartermijnen per verwerking: zie
[privacy-role-matrix.md](privacy-role-matrix.md). Hier staat de organisatorische
kant.

## Als verwerkingsverantwoordelijke

| Verwerking | Doel | Grondslag | Betrokkenen | Categorieën | Bewaartermijn | Beveiliging |
| --- | --- | --- | --- | --- | --- | --- |
| Gebruikersaccounts | Toegang tot de dienst | Overeenkomst | Gebruikers van klanten | Naam, e-mail, wachtwoordhash, MFA-secret (versleuteld) | Duur account + 3 maanden | Zie [TOM](technical-and-organisational-measures.md) |
| Beveiligingslogs | Misbruik voorkomen en onderzoeken | Gerechtvaardigd belang | Gebruikers | IP-hash, tijdstip, actie | 12 maanden | Append-only, beperkte toegang |
| Abonnement en facturatie | Overeenkomst uitvoeren, fiscale bewaarplicht | Overeenkomst, wettelijke verplichting | Contactpersonen | NAW, e-mail, factuurgegevens | 7 jaar | Standaard |
| Support | Vragen beantwoorden | Overeenkomst | Gebruikers | Naam, e-mail, inhoud van het gesprek | 24 maanden | Standaard |
| Marketing | Product aanbieden | Toestemming of gerechtvaardigd belang | Prospects, klanten | Naam, e-mail, bedrijf | Tot intrekking | Standaard |
| Sollicitaties | Werving | Toestemming | Sollicitanten | CV, contactgegevens | 4 weken, of 1 jaar met toestemming | Standaard |

## Als verwerker, namens de klant

| Verwerking | Doel | Categorieën | Bewaartermijn | Instructie |
| --- | --- | --- | --- | --- |
| Financiële administratie | De klant zijn boekhouding laten voeren | Relatiegegevens, bedragen, documenten, banktransacties | Door de klant ingesteld, minimaal de fiscale bewaarplicht | Verwerkersovereenkomst |
| Documentopslag | Bewijsstukken bewaren | Wat er op de documenten staat | Idem | Idem |
| Facturen versturen | Bezorging namens de klant | E-mailadres van de ontvanger | Verzendlog 12 maanden | Idem |
| OCR (fase 2, standaard uit) | Invoer besparen | Documentinhoud na redactie | Geen bewaring bij de provider | Aanzetten door de klant |
| AI-voorstellen (fase 2, standaard uit) | Boekingsvoorstellen | Geminimaliseerde kenmerken | Voorstellen 7 jaar; prompts niet bewaard | Aanzetten door de klant |

## Bijzondere persoonsgegevens

Gedmma is niet bedoeld voor bijzondere persoonsgegevens of het BSN. Het datamodel
kent er geen velden voor. Ze kunnen wel onbedoeld in een geüpload document
voorkomen — een salarisstrook, een kopie van een identiteitsbewijs.

Daarom:

* documenten kunnen worden geclassificeerd als **gevoelig**, waarna een apart
  recht nodig is om ze te openen;
* elke opening en download van zo'n document wordt geregistreerd;
* de gebruikersinterface waarschuwt bij het uploaden dat er geen kopieën van
  identiteitsbewijzen of BSN in horen;
* redactie vóór verzending naar een externe OCR- of AI-provider is verplicht
  (zie [ai-governance.md](ai-governance.md)).

## Onderhoud van dit register

| Wanneer | Wat |
| --- | --- |
| Bij een nieuwe functie die persoonsgegevens raakt | Regel toevoegen, DPIA-screening doen |
| Bij een nieuwe subverwerker | [subprocessor-register.md](subprocessor-register.md) bijwerken en klanten informeren |
| Elk half jaar | Volledige review door de privacyverantwoordelijke |
| Bij een wetswijziging | Zie [legal-source-register.md](legal-source-register.md) |
