# Juridisch bronnenregister

## Waarvoor dit register dient

Wetgeving verandert; software die regels hardcodeert, wordt stil onjuist. Dit
register houdt per onderwerp bij welke bron geldt, wanneer die is geraadpleegd
en wanneer hij opnieuw moet worden bekeken. Het is de tegenhanger van de
ontwerpkeuze dat tarieven, perioden en aangiftevakken **data** zijn en geen code
(zie [accounting-engine.md](accounting-engine.md)).

## Status van dit register

**Niets in dit register is op dit moment door een jurist of fiscalist
geverifieerd.** De onderwerpen en bronnen zijn geïnventariseerd door het
ontwikkelteam; de kolom "Geraadpleegd" is bewust leeg gelaten waar dat niet is
gebeurd. Het invullen daarvan is een expliciete actie vóór productiegebruik, met
een eigenaar per regel.

Regels die als uitgangspunt in de software zijn verwerkt, staan hieronder met de
vermelding **aanname**. Ze zijn gebaseerd op algemeen bekende, breed gedeelde
uitgangspunten en zijn zo geïmplementeerd dat wijzigen een configuratiewijziging
is, geen codewijziging.

## Register

| # | Onderwerp | Bron | Waar in het product | Aanname in de software | Geraadpleegd | Herbeoordelen | Eigenaar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L1 | Algemene verordening gegevensbescherming | EUR-Lex, verordening (EU) 2016/679 | Hele product | Rolverdeling verwerker/verantwoordelijke | nog niet | vóór productie | privacyjurist |
| L2 | Uitvoeringswet AVG | wetten.overheid.nl | Idem | — | nog niet | vóór productie | privacyjurist |
| L3 | Btw-tarieven Nederland | Belastingdienst | `tax_code`-rijen bij het aanmaken van een administratie | **aanname**: 21% hoog, 9% laag, 0% en vrijgesteld | nog niet | jaarlijks + bij wijziging | fiscalist |
| L4 | Vakken aangifte omzetbelasting | Belastingdienst | `AANGIFTE_VAKKEN` in `packages/accounting` | **aanname**: vakindeling 1a t/m 5b | nog niet | jaarlijks | fiscalist |
| L5 | Wettelijke factuurvereisten | Wet op de omzetbelasting 1968, artikel 35a | `controleerFactuurvereisten()` | **aanname**: datum, nummer, NAW beide partijen, btw-nummer, omschrijving, aantal, bedrag per tarief, tarief, btw-bedrag; extra eisen bij verlegging en IC-levering | nog niet | jaarlijks | fiscalist |
| L6 | Fiscale bewaarplicht | Algemene wet inzake rijksbelastingen, artikel 52 | `retention_policy`-rijen | **aanname**: 7 jaar basisgegevens, 10 jaar gegevens over onroerende zaken | nog niet | jaarlijks | fiscalist |
| L7 | Intracommunautaire leveringen en ICP | Btw-richtlijn 2006/112/EG, Wet OB | Btw-code `VK-ICL`, ICP-overzicht | **aanname**: nultarief met geldig btw-identificatienummer van de afnemer | nog niet | jaarlijks | fiscalist |
| L8 | Btw verlegd | Wet OB 1968, artikel 12 | Btw-codes `VK-VERLEGD`, `IN-VERLEGD` | **aanname**: afdracht en aftrek in dezelfde aangifte | nog niet | jaarlijks | fiscalist |
| L9 | PSD2 en opvolgende regelgeving | De Nederlandsche Bank, richtlijn (EU) 2015/2366 | Bankkoppelingen (fase 3) | **aanname**: rekeninginformatie vereist een vergunninghoudende AISP | nog niet | vóór fase 3 | juridisch |
| L10 | SEPA | European Payments Council rulebooks | Betaalbestanden (fase 3) | — | nog niet | vóór fase 3 | juridisch |
| L11 | Peppol en e-facturatie | Peppol BIS, NLCIUS | UBL-generatie | **aanname**: EN 16931-profiel; verzending vereist een geaccrediteerd access point | nog niet | vóór fase 3 | product |
| L12 | RGS | Referentie Grootboekschema | `rgs_code` op grootboekrekeningen | **aanname**: optioneel veld; volledige mapping in fase 4 | nog niet | vóór fase 4 | fiscalist |
| L13 | SBR en Digipoort | Logius | Aangifte indienen (fase 4) | **aanname**: vereist PKIoverheid-certificaat | nog niet | vóór fase 4 | juridisch |
| L14 | Nederlandse Auditfile Financieel | XBRL Nederland | Auditfile-export (fase 4) | — | nog niet | vóór fase 4 | product |
| L15 | Telecommunicatiewet, cookies | wetten.overheid.nl, Autoriteit Persoonsgegevens | Cookiebeleid | **aanname**: alleen noodzakelijke opslag zonder toestemming | nog niet | vóór productie | privacyjurist |
| L16 | Europese AI-verordening | EUR-Lex, verordening (EU) 2024/1689 | AI-functies (fase 2) | **aanname**: assistentie zonder zelfstandige besluiten; transparantie- en toezichtplichten | nog niet | vóór fase 2 | juridisch |
| L17 | Europese Data Act | EUR-Lex, verordening (EU) 2023/2854 | Export en exit | **aanname**: overstappen mag technisch niet worden belemmerd | nog niet | vóór productie | juridisch |
| L18 | NIS2 en Cyberbeveiligingswet | Rijksinspectie Digitale Infrastructuur | Beveiliging en melding | **aanname**: toepasselijkheid hangt af van omvang en sector; te toetsen | nog niet | vóór productie | juridisch |
| L19 | DORA | EUR-Lex, verordening (EU) 2022/2554 | Alleen bij financiële afnemers | **aanname**: buiten scope tenzij een afnemer eronder valt | nog niet | vóór productie | juridisch |
| L20 | Wwft | wetten.overheid.nl | Alleen bij eigen diensten die eronder vallen | **aanname**: buiten scope; boekhoudsoftware zelf is geen instelling | nog niet | vóór productie | juridisch |
| L21 | Toegankelijkheid digitale diensten | European Accessibility Act, EN 301 549 | Webapp en apps | **aanname**: WCAG 2.2 AA als bouwnorm | nog niet | vóór productie | product |
| L22 | Internationale doorgifte | EDPB-richtsnoeren, adequaatheidsbesluiten | Subverwerkers | **aanname**: voorkeur voor NL/EER; buiten de EER alleen met SCC's en een TIA | nog niet | vóór productie | privacyjurist |
| L23 | Regels van Apple en Google | App Store Review Guidelines, Google Play Policy | Mobiele apps (fase 3) | **aanname**: privacylabels, machtigingen en accountverwijdering verplicht | nog niet | vóór fase 3 | product |
| L24 | Consumentenrecht | Burgerlijk Wetboek boek 6 | Alleen bij verkoop aan consumenten | **aanname**: product wordt zakelijk aangeboden | nog niet | bij wijziging doelgroep | juridisch |
| L25 | eIDAS en elektronische handtekening | Verordening (EU) 910/2014 | Ondertekenen (later) | **aanname**: buiten de MVP | nog niet | bij invoering | juridisch |

## Werkwijze bij een wetswijziging

1. De eigenaar van de regel signaleert de wijziging (of de periodieke controle
   doet dat).
2. De wijziging wordt beoordeeld: raakt hij data, code of alleen documentatie?
3. Raakt hij data (tarief, vak, termijn), dan komt er een migratie met een
   **nieuwe rij** met een eigen geldigheidsdatum. De oude rij krijgt een
   einddatum. Bestaande boekingen blijven verwijzen naar de code die gold.
4. Raakt hij code, dan volgt de gewone ontwikkelcyclus met tests.
5. Het register wordt bijgewerkt met bron, datum en de nieuwe
   herbeoordelingsdatum.

## Wat hier niet mag

Geen juridische claim op basis van een commerciële blog, een samenvatting of een
antwoord van een taalmodel. Alleen de geconsolideerde wetstekst of een publicatie
van de bevoegde instantie telt als bron.
