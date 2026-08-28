# Het prijsplan, en waarom

## Wat het wordt

| | Gratis | Maandelijks | Per jaar |
| --- | --- | --- | --- |
| Prijs | €0 | **€4,99 per maand** | **€39,99 per jaar** (€3,33 p/m) |
| Opzeggen | n.v.t. | wanneer je wilt, geen opzegtermijn | loopt gewoon af |
| Proefperiode | – | 14 dagen | 14 dagen |
| Rekenen | onbeperkt | onbeperkt | onbeperkt |
| Andere vijf vakken | 10 vragen per dag | onbeperkt | onbeperkt |
| Uitlegfilmpjes | 3 | alle | alle |
| Kindprofielen | 1 | 5 | 5 |
| Advertenties | nooit | nooit | nooit |

## Waar Squla staat

Op het moment van schrijven (augustus 2026) rekent Squla:

- **€10,99 per maand** bij een jaarabonnement
- **€16,99 per maand** bij een kwartaalabonnement
- 7 dagen gratis proberen
- doorlopend lidmaatschap met **een maand opzegtermijn**

Dat betekent: goedkoopst uit ben je bij Squla op ongeveer **€132 per jaar**.
Slimvos Compleet kost **€39,99 per jaar**. Dat is grofweg **70% minder**.

Controleer die cijfers zelf voordat je ermee adverteert — prijzen veranderen,
en een verkeerde vergelijking in een storebeschrijving is een probleem.

## De redenering achter elk getal

### Waarom €4,99 en niet €2,99

Onder de €5 blijven is belangrijk: dat is de grens waaronder een ouder de
beslissing niet meer echt weegt. Maar té laag gaan werkt tegen je. Bij €2,99
lees je als speeltje, trek je klanten die na twee maanden weer weg zijn, en
houd je na de winkelcommissie zo weinig over dat je nooit iets kunt bouwen.
€4,99 is minder dan de helft van Squla's goedkoopste maandbedrag en toch een
prijs die serieus oogt.

### Waarom €39,99 per jaar

Dat is 33% korting op twaalf losse maanden — je betaalt acht maanden voor
twaalf. Die korting moet groot genoeg zijn om de sprong te maken, maar niet zo
groot dat het maandplan zinloos wordt. Onder de 25% stapt bijna niemand over;
boven de 45% verkoop je je maandplan kapot.

Het jaarplan is ook het bedrag waarmee je adverteert, want daar is het verschil
met de concurrent het grootst.

### Waarom een gratis laag en niet alleen een proefperiode

Squla geeft 7 dagen. Een proefperiode zet een klok op je kind: over een week
moet je beslissen. Dat is precies het gevoel dat ouders bij dit soort apps
tegenhoudt.

Een gratis laag die blijft bestaan doet drie dingen beter:

1. **Geen creditcard nodig om te beginnen.** De grootste drempel is niet de
   prijs, het is het invullen van betaalgegevens voor iets wat je nog niet kent.
2. **Mond-tot-mondreclame kost niets.** Een gratis gebruiker die het op het
   schoolplein aanraadt, is de goedkoopste marketing die er is.
3. **Je kunt het rustig laten liggen.** Een kind dat een maand niet oefent en
   dan terugkomt, vindt zijn voortgang gewoon terug in plaats van een paywall.

De keuze om **rekenen helemaal gratis** te maken is bewust: dat is het vak waar
ouders het meest om geven en waar de app zijn waarde het snelst laat zien. De
andere vakken op 10 vragen per dag zetten is genoeg om te proeven en te weinig
om er een schooljaar op te draaien.

### Waarom geen opzegtermijn

Squla hanteert een maand opzegtermijn. Via de App Store en Google Play is
opzeggen per definitie direct, met behoud van toegang tot het einde van de
periode. Dat is niet alleen goedkoper voor de klant, het is eerlijker, en het
is precies wat "laagdrempelig beginnen" betekent. Zet het ook zo in je
storebeschrijving — het is een echt verschil, geen marketingzin.

### Waarom tot vijf kinderen

Eén abonnement voor het hele gezin. Voor een gezin met drie kinderen komt het
jaarplan neer op €13,33 per kind per jaar. Dat is een getal waar geen enkele
concurrent tegenop kan, en het kost je niets extra: de app draait op het
toestel.

## Rekent het uit?

Bij €39,99 per jaar:

| | |
| --- | --- |
| Wat de ouder betaalt (incl. 21% btw) | €39,99 |
| Exclusief btw | €33,05 |
| Min 15% winkelcommissie (Small Business Program, tot $1 mln omzet) | **€28,09 netto** |
| Per maand | €2,34 |

Kosten om te draaien:

- **Oefenen zelf: €0.** De vragen worden op het toestel gegenereerd en de
  filmpjes worden in de app getekend. Geen server per vraag, geen videohosting.
- **Accounts en synchronisatie:** een Supabase- of Firebase-abonnement van
  ongeveer €25 per maand bedient duizenden gezinnen.
- **Stores:** $99 per jaar (Apple) en $25 eenmalig (Google).

Break-even op die vaste kosten ligt rond de **20 tot 30 betalende gezinnen per
jaar**. De echte kostenpost is niet de techniek maar het binnenhalen van
klanten, en dat is precies waarom de gratis laag zijn geld waard is.

Let op: gaat de commissie naar 30% (boven $1 mln omzet), dan zakt de netto
opbrengst naar €23,14 per jaar. Ook dan klopt het, maar houd er rekening mee.

## Waar ik voor waarschuw

- **Doe niet mee aan kortingscodes.** Squla adverteert met €10 korting. Bij
  €39,99 is die ruimte er niet, en je traint klanten om nooit de volle prijs te
  betalen.
- **Een jaarplan is een belofte.** Je hebt het geld meteen, maar je moet dat
  jaar wel content blijven leveren. Plan dat in.
- **Verhogen doet pijn.** €4,99 is bewust niet het laagste dat kan. Begin niet
  lager dan je wilt eindigen.
- **De vergelijking met Squla moet blijven kloppen.** Zet de datum erbij, zoals
  in de app gebeurt, en werk hem bij als hun prijzen veranderen.

## Wat er technisch nog moet gebeuren

De hele stroom zit in de app: plannen kiezen, proefperiode, opzeggen,
hervatten, toegangsregels. Wat ontbreekt is de koppeling met de winkels. In
`src/state/aankoop.ts` zit nu een implementatie die niets afschrijft; daar komt
RevenueCat of `expo-in-app-purchases` voor in de plaats, met de product-ids uit
`src/core/abonnement/plannen.ts`:

```
nl.slimvos.app.compleet.maand
nl.slimvos.app.compleet.jaar
```

De schermen hoeven daarvoor niet te veranderen.
