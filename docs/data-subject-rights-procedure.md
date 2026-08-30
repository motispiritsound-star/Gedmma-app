# Rechten van betrokkenen: procedure

## Wie handelt wat af

| Verzoek gaat over | Wie handelt af | Rol van de ander |
| --- | --- | --- |
| Een gebruikersaccount van Gedmma | de exploitant | — |
| Gegevens in de administratie van een klant (bijvoorbeeld een klant of leverancier van die klant) | **de klant** | de exploitant ondersteunt met inzage- en exportfuncties |

Komt er bij de exploitant een verzoek binnen dat over de administratie van een
klant gaat, dan wordt het onverwijld doorgezet naar die klant, met een bericht
aan de verzoeker dat en waarom dat gebeurt.

## Het privacy request center

In de applicatie kunnen bevoegde beheerders (recht `privacy.beheren`) verzoeken
registreren en afhandelen. Per verzoek wordt vastgelegd:

| Stap | Wat er gebeurt |
| --- | --- |
| Registreren | Soort verzoek, wie het doet, wanneer, waarover |
| Identificeren | Wie is de betrokkene, om welke gegevens gaat het |
| Verifiëren | Vaststellen dat de verzoeker is wie hij zegt te zijn, zonder onnodig extra gegevens op te vragen |
| Toewijzen | Aan een verantwoordelijke, met de wettelijke termijn erbij |
| Beoordelen | Kan het, moet het, botst het met een bewaarplicht |
| Uitvoeren | Inzage, correctie, verwijdering, beperking, export |
| Gedeeltelijk weigeren | Met motivering, en met vermelding van wat er wél is gedaan |
| Exporteren | Machineleesbaar en leesbaar |
| Afsluiten | Met de uitkomst en de communicatie aan de betrokkene |
| Auditeren | Alle stappen staan in de audit trail |

De wettelijke termijn wordt bij registratie berekend en bewaakt; het overzicht
toont verzoeken waarvan de termijn nadert.

## Per recht

| Recht | Wat het systeem doet | Beperkingen |
| --- | --- | --- |
| Informatie | De privacyverklaring is in de applicatie beschikbaar, gelaagd: korte uitleg bij het scherm, volledige tekst erachter | — |
| Inzage | Overzicht van alle gegevens over de betrokkene, plus een export | Gegevens van anderen worden niet meegegeven |
| Rectificatie | Corrigeren van relatiegegevens; een fout in een **definitieve** boeking gaat via een correctieboeking | Een definitieve boeking wordt nooit stil aangepast |
| Verwijdering | Verwijderen waar het mag; anders pseudonimiseren of afschermen | Fiscale bewaarplicht gaat voor; wordt gemotiveerd |
| Beperking | Markeren als "beperkt": wel bewaren, niet meer gebruiken | Zichtbaar in de interface |
| Overdraagbaarheid | Machineleesbare export (JSON en CSV) | Alleen gegevens die de betrokkene zelf heeft aangeleverd of die op grond van toestemming of overeenkomst zijn verwerkt |
| Bezwaar | Registreren, beoordelen, en bij gerechtvaardigd belang opnieuw afwegen | Uitkomst wordt gemotiveerd |
| Toestemming intrekken | Direct effect; de betreffende verwerking stopt | Verwerkingen op een andere grondslag lopen door |
| Bezwaar tegen geautomatiseerde besluitvorming | Er worden geen besluiten met aanzienlijke gevolgen automatisch genomen; voorstellen zijn altijd te weigeren | Zie [ai-governance.md](ai-governance.md) |
| Klacht | Registreren, behandelen, en wijzen op de Autoriteit Persoonsgegevens | — |

## De botsing tussen wissen en bewaren

Dit is het gevoeligste punt in een boekhoudpakket, dus expliciet:

Een verzoek om verwijdering van iemand die als klant op facturen staat, kan niet
leiden tot het weggooien van die facturen zolang de fiscale bewaarplicht loopt.
Wat wél gebeurt:

1. De relatie wordt gemarkeerd als **beperkt**: hij verschijnt niet meer in
   keuzelijsten en er kan niet meer op worden geboekt.
2. Contactgegevens die niet nodig zijn voor de bewaarplicht (telefoonnummer,
   notities, tags) worden verwijderd.
3. De gegevens die op de factuur zelf staan blijven staan, want die factuur is
   het bewijsstuk.
4. Bij het aflopen van de bewaartermijn wordt de relatie meegenomen in de
   gecontroleerde vernietiging.
5. De betrokkene krijgt uitleg: wat is verwijderd, wat blijft, waarom, en tot
   wanneer.

Dat laatste is geen formaliteit. Een verzoek gedeeltelijk weigeren zonder uitleg
is een schending; met uitleg is het een correcte afweging tussen twee wettelijke
plichten.
