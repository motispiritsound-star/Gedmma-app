# Testscript voor de accountant

Bedankt dat je hiernaar wilt kijken. Dit is een proefversie van Gedmma, een
Nederlands boekhoudpakket in aanbouw. We willen weten of het klopt en of het
werkt zoals jij het zou willen — niet of het mooi is.

## Voordat je begint

* **Alle gegevens hierin zijn verzonnen.** Het bedrijf, de klanten, de bedragen:
  alles is verzonnen. Zet er geen echte administratie in, ook niet van jezelf.
  Bovenin staat een balk die dat herhaalt.
* **Je kunt niets stukmaken.** Alles wat je doet, kan opnieuw worden opgezet.
  Probeer gerust dingen die niet mogen; juist daar leren we van.
* **Onderin elk scherm zit de knop "Iets opgemerkt?"** Daarmee schrijf je op wat
  je ziet. We noteren zelf op welk scherm je stond, dus dat hoef je er niet bij
  te zetten. Klein en tussendoor is beter dan één lange lijst achteraf.

Er zit een demo-administratie klaar van een ontwerpstudio: tien facturen, acht
inkoopbonnen, een ingelezen bankafschrift en 46 uur op drie projecten.

## Wat we vooral willen weten

1. Klopt het boekhoudkundig?
2. Zou jij hiermee een klant kunnen bedienen, of mis je iets waardoor dat niet kan?
3. Waar zou een ondernemer zonder boekhoudkennis de mist in gaan?

## De ronde

Loop deze punten door. Bij elk punt staat wat we willen weten; noteer per punt
of het klopt, en wat er mis of onhandig aan is.

### 1. Eerste indruk (5 minuten)

Open het dashboard en kijk rond zonder iets te doen.

* Snap je binnen een halve minuut waar je naar kijkt?
* Staan de cijfers die jij als eerste zou willen zien, ook vooraan?
* Is er een cijfer waarvan je niet weet hoe het is opgebouwd?

### 2. De cijfers narekenen (15 minuten)

Ga naar **Cijfers**.

* **Balans**: sluit hij? Staan de rubrieken waar jij ze verwacht?
* **Winst en verlies**: klopt het resultaat met de balans?
* **Proef- en saldibalans**: kloppen debet en credit?
* Klik een bedrag aan. Je komt op de grootboekkaart, en van daar op de boeking.
  **Kun je van elk bedrag terug naar de onderliggende factuur?**
* **Btw-overzicht**: kloppen de vakken? Sluit het aan op de btw-rekeningen?
  Zou je op basis hiervan aangifte durven doen — en zo nee, wat mis je?

### 3. Een factuur van begin tot eind (15 minuten)

* Maak een nieuwe factuur voor een bestaande klant. Let op wat er gebeurt met
  de btw en het totaal terwijl je typt.
* Maak hem definitief. **Wat gebeurt er met het nummer, en kun je hem daarna
  nog wijzigen?** Probeer het.
* Maak een creditnota op een bestaande factuur. **Klopt de tegenboeking?**
* Zoek een factuur op met de zoekbalk, filter op "alleen te laat", sorteer op
  bedrag. **Kloppen de totalen bovenaan met wat je eronder ziet?**

### 4. Inkoop en bank (15 minuten)

* Ga naar **Bank**. Er staan drie transacties die nog verwerkt moeten worden.
  Koppel er een. **Snap je waarom het voorstel wordt gedaan dat wordt gedaan?**
* Boek een transactie waarvoor geen factuur bestaat, rechtstreeks op een
  grootboekrekening.
* Bekijk het scherm **Bonnen en inkoop**. Leg een inkoopfactuur vast met btw
  verlegd. **Komt die aan beide kanten in de aangifte terecht?**

### 5. Uren (10 minuten)

* Ga naar **Uren**. Schrijf een paar uur op een project.
* Ga naar **Projecten**. Er staan uren klaar die nog beoordeeld moeten worden.
* Maak van goedgekeurde uren een factuur. **Kloppen de regels? Is het bedrag
  na te rekenen? Wat vind je van de omschrijving die erop komt?**

### 6. Perioden en de audit trail (10 minuten)

* Ga naar **Instellingen → Perioden**. Sluit een periode en probeer daarna in
  die periode te boeken. **Wordt dat geweigerd, en is de melding begrijpelijk?**
* Ga naar **Instellingen → Wat is er gebeurd**. Druk op de controleknop.
  **Is dit spoor genoeg om een controle mee te doorstaan? Wat mis je?**

### 7. Doe iets doms (10 minuten)

Dit is het waardevolste deel. Probeer het pakket te laten struikelen:

* Een factuur maken zonder adres van de klant.
* Een boeking die niet in evenwicht is.
* Twee keer dezelfde inkoopfactuur van dezelfde leverancier.
* Hetzelfde bankafschrift twee keer inlezen.
* Een negatief aantal, een bedrag met vier decimalen, een datum in 1900.
* Een gefactureerd uur wijzigen.

**Krijg je bij elke poging een melding die uitlegt wat er mis is en wat je kunt
doen? Of gebeurt er stilletjes iets geks?**

## Waar we het meest benieuwd naar zijn

Schrijf hier je oordeel over, ook als het kort is:

| Vraag | |
| --- | --- |
| Klopt de boekhouding? | |
| Mis je iets waardoor je hier geen klant mee zou kunnen bedienen? | |
| Wat is het eerste dat je zou veranderen? | |
| Wat zou een ondernemer zonder boekhoudkennis hier fout doen? | |
| Zou je dit aan een klant durven aanbevelen — en zo nee, wat moet er eerst bij? | |

## Wat er bewust nog niet in zit

Zodat je daar geen tijd aan verliest:

* Aangifte doen bij de Belastingdienst (SBR/Digipoort) — het overzicht en de
  aansluiting zijn er, het indienen niet.
* Een directe bankkoppeling — die vereist een vergunninghoudende provider;
  inlezen via bestand werkt volledig.
* Voorraad, vaste activa, jaarafsluiting en consolidatie.
* Het accountantsportaal, waarin jij meerdere klanten naast elkaar ziet.
* Salarisadministratie.
* De AI-assistent. Het datamodel en het register van voorstellen staan er wel,
  en het uitgangspunt is vastgelegd: AI doet voorstellen, en boekt nooit
  zelfstandig iets definitiefs.

## En een eerlijk voorbehoud

De compliancedocumentatie bij dit product is opgesteld door het ontwikkelteam en
is **niet juridisch geverifieerd**. Er staat nergens de claim dat dit product
volledig AVG-proof of volledig conform de Nederlandse wetgeving is. Wat er is
gebouwd, staat per punt beschreven in
[compliance-matrix.md](compliance-matrix.md); wat er nog getoetst moet worden
ook. Als jij als accountant ziet dat er iets ontbreekt dat wél moet, is dat
precies de feedback die we zoeken.
