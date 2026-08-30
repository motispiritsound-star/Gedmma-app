# Classificatie van gegevens

## Waarom

Niet alles is even gevoelig. Door dat expliciet te maken, kunnen de maatregelen
erop worden afgestemd: extra rechten voor het gevoeligste, geen onnodige drempels
voor de rest.

## Niveaus

| Niveau | Wat | Voorbeelden | Maatregelen |
| --- | --- | --- | --- |
| **Openbaar** | Mag iedereen zien | Marketingteksten, documentatie, statuspagina | Geen |
| **Intern** | Alleen binnen de organisatie van de exploitant | Roadmap, architectuur, metrics | Toegang op basis van rol |
| **Vertrouwelijk** | Klantgegevens in de normale zin | Relaties, facturen, banktransacties, rapportages | Tenantisolatie, rollen en rechten, versleuteling in transport en opslag, auditlogging |
| **Gevoelig** | Bijzondere of extra beschermenswaardige gegevens | Documenten met een salarisstrook, een BSN of een kopie identiteitsbewijs; MFA-secrets; banktokens | Alles van vertrouwelijk, plus een apart recht (`document.gevoelig.lezen`), kolomversleuteling, registratie van elke inzage |
| **Geheim** | Sleutelmateriaal | Encryptiesleutels, pepper, API-secrets van subverwerkers | Uitsluitend in de secrets manager; nooit in code, logs, tickets of back-ups van de applicatie |

## In het product

* Elk document heeft een veld `classificatie` met de waarde `normaal` of
  `gevoelig`.
* Een gevoelig document openen of downloaden vereist het recht
  `document.gevoelig.lezen`; dat zit niet in de standaardrollen `viewer` en
  `employee`.
* Elke inzage en download van een document wordt vastgelegd in `document_event`
  en in de audit trail.
* Bij het uploaden waarschuwt de interface dat kopieën van identiteitsbewijzen en
  het BSN niet in een boekhoudpakket horen.
* Vóór verzending naar een externe OCR- of AI-provider worden gevoelige velden
  geredigeerd; gevoelig geclassificeerde documenten gaan er helemaal niet heen
  (zie [ai-governance.md](ai-governance.md)).

## In logs

| Niveau | Mag in een logregel? |
| --- | --- |
| Openbaar, intern | Ja |
| Vertrouwelijk | Alleen identificatoren en bedragen, geen vrije tekst en geen documentinhoud |
| Gevoelig | Nee |
| Geheim | Nee, nooit |

De logger maskeert automatisch velden met namen als `password`, `token`,
`secret`, `iban` en `bsn`, kort lange waarden in, en maskeert e-mailadressen tot
`j***@voorbeeld.nl`. Een test controleert dat er geen wachtwoorden, tokens of
documentinhoud in de logs terechtkomen.

## In omgevingen

| Niveau | Ontwikkel | Test | Acceptatie | Productie |
| --- | --- | --- | --- | --- |
| Vertrouwelijk en hoger | nee | nee | nee (synthetisch) | ja |

Productiedata gaat nooit naar een andere omgeving. Voor acceptatie en demo's
wordt synthetische data gegenereerd.
