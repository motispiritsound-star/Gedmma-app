# Belangenafwegingen (gerechtvaardigd belang)

Waar een verwerking op gerechtvaardigd belang steunt, hoort een gedocumenteerde
afweging. Hieronder staan de afwegingen die nu van toepassing zijn.

**Deze afwegingen zijn opgesteld door het ontwikkelteam en nog niet juridisch
getoetst.**

Toestemming wordt niet gebruikt waar de verwerking noodzakelijk is voor de
overeenkomst of een wettelijke verplichting. Toestemming die je in de praktijk
niet kunt weigeren, is geen toestemming.

---

## LIA-1: beveiligingslogging en misbruikbestrijding

**Verwerking.** Bij elke aanmelding en bij mislukte pogingen worden het tijdstip,
een versleuteld kenmerk van het IP-adres en het apparaat vastgelegd. Bij te veel
mislukte pogingen wordt het account tijdelijk geblokkeerd.

**Belang.** Accounts beschermen tegen overname. Een boekhoudaccount geeft toegang
tot bankgegevens en de volledige administratie; overname is voor de betrokkene
zelf het schadelijkst.

**Noodzaak.** Zonder registratie van pogingen is een aanval niet te herkennen of
te stoppen. Een minder ingrijpend alternatief dat hetzelfde bereikt, is er niet.

**Afweging.** De inbreuk is klein: het IP-adres wordt niet in leesbare vorm
bewaard maar als hash met een pepper, de bewaartermijn is twaalf maanden, en de
gegevens worden alleen voor beveiliging gebruikt. De betrokkene heeft er zelf
direct belang bij. De verwachting van de betrokkene sluit hierop aan: van een
financiële dienst verwacht je dat aanmeldingen worden gelogd.

**Waarborgen.** IP-hashing, korte bewaartermijn, beperkte toegang, geen gebruik
voor een ander doel, zichtbaar apparaatoverzicht voor de gebruiker zelf.

**Uitkomst.** Gerechtvaardigd belang is een passende grondslag.

---

## LIA-2: productanalyse

**Verwerking.** Geaggregeerde tellingen van functiegebruik, bijvoorbeeld hoeveel
facturen er per week definitief worden gemaakt.

**Belang.** Het product verbeteren en zien waar gebruikers vastlopen.

**Noodzaak.** Zonder enige meting is verbeteren gokwerk.

**Afweging.** De verwerking is zo ingericht dat er **geen persoonsgegevens** in
zitten: er worden alleen aantallen bijgehouden, zonder gebruiker-id,
administratie-id of tijdstempel die tot een persoon herleidbaar is. Daarmee valt
deze verwerking strikt genomen buiten de AVG. De afweging staat hier omdat de
grens dun is: zodra er een identificator bij zou komen, verandert de beoordeling
en is deze grondslag niet meer voldoende.

**Waarborgen.** Zelf gehost, geen externe analyticsdienst, geen cookies, geen
identificatoren, bewaartermijn 13 maanden, en een expliciete ontwerpregel dat er
geen identificerende velden aan worden toegevoegd zonder nieuwe beoordeling.

**Uitkomst.** Toelaatbaar in de huidige vorm. Bij elke uitbreiding: opnieuw
beoordelen.

---

## LIA-3: dubbeldetectie bij relaties

**Verwerking.** Bij het aanmaken van een relatie wordt de naam genormaliseerd en
vergeleken met bestaande relaties binnen dezelfde administratie.

**Belang.** Voorkomen dat dezelfde klant twee keer in de administratie staat, wat
tot onjuiste openstaande posten en dubbele aanmaningen leidt.

**Noodzaak.** Zonder deze controle ontstaan er in de praktijk dubbele relaties,
met directe schade voor de betrokkene (twee keer aangemaand worden).

**Afweging.** De vergelijking gebeurt uitsluitend binnen de administratie van de
klant zelf, met gegevens die die klant al heeft. Er wordt niets over
administraties heen vergeleken en er wordt geen extern bestand geraadpleegd.

**Waarborgen.** Alleen binnen de tenant, alleen op naam, en de gebruiker beslist
zelf of het echt een andere partij is.

**Uitkomst.** Gerechtvaardigd belang is passend.

---

## LIA-4: bericht aan bestaande klanten over vergelijkbare functies

**Verwerking.** Een e-mail aan bestaande klanten over een nieuwe functie in het
product dat zij al afnemen.

**Belang.** Klanten laten weten wat er in het product dat ze gebruiken is
veranderd.

**Afweging.** Dit is toelaatbaar zolang het gaat om het eigen, vergelijkbare
product, er bij het verzamelen van het adres een afmeldmogelijkheid is geboden en
die in elk bericht opnieuw wordt geboden.

**Waarborgen.** Afmelden in elk bericht, suppressielijst, strikte scheiding
tussen transactionele berichten, beveiligingsmeldingen, servicecommunicatie,
productupdates en commerciële marketing. Een noodzakelijk servicebericht wordt
nooit gebruikt om er reclame in te verstoppen.

**Uitkomst.** Toelaatbaar binnen die grenzen; alles daarbuiten vraagt
toestemming. Dit punt vraagt bevestiging door een jurist, omdat de regels voor
elektronische communicatie hier bepalend zijn.
