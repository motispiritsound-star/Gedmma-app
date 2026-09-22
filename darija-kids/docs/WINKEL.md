# Wat je er nog naast verkoopt

Het abonnement is de motor. Dit gaat over wat je erbij verkoopt: producten die
de band met Marokko sterker maken, die een grootouder cadeau wil doen, en die
niet elke maand opnieuw verdiend hoeven te worden.

Lees §1 voor de volgorde, §2 voor het antwoord op de verhalenreeks, en §7 voor
hoe je op een website zonder backend iets verkoopt zonder in de
btw-administratie van zesentwintig landen te belanden.

## 0. Wat er al is

Twee dingen, zodat je ze niet opnieuw bouwt:

- **Het e-boek bestaat.** `npm run ebook` maakt het in zes talen — elk woord,
  elke letter en de grammatica in één PDF, rechtstreeks uit de inhoud van de
  app. Het staat als `app.darijaforkids.ebook` voor € 14,99 in beide winkels,
  eenmalig, met gezinsbibliotheek aan.
- **Vier verhalen** staan in de app (`src/content/stories.ts`): korte dialogen
  met vragen erachter, elke regel aan te tikken voor vertaling en klank.

Dat eerste is een **naslagwerk**. Wat je nu voorstelt is iets anders, en dat
verschil is precies waarom het kan werken.

## 1. De volgorde, en één waarschuwing

De verleiding is om alles tegelijk op de website te zetten. Doe dat niet.

**Een winkel op je startpagina verlaagt je abonnementsconversie.** Een ouder
die twijfelt tussen € 59,99 per jaar en een boek van € 12,99 kiest het boek,
en dan ben je een klant van vijf jaar kwijt voor één marge. Dus:

- de **startpagina** blijft over het abonnement gaan
- de **winkel** krijgt een eigen pagina, met een link in de voettekst
- in de **app** komt de winkel achter de ouderpoort (die rekensom die er al
  is) en pas op een moment van succes: na een afgeronde unit, niet bij het
  eerste scherm

En binnen de app geldt het beleid van Apple en Google: naar een eigen winkel
linken mag, maar niet als verkapte omweg om hun afrekening te vermijden voor
wat je in de app aanbiedt. Fysieke producten en boeken buiten de app vallen
daarbuiten — daar is een link gewoon toegestaan, mits achter de ouderpoort.

## 2. De verhalenreeks — ja, maar niet als e-boek

Je idee is goed, en de uitvoering die je noemt is de valkuil.

**Het probleem:** een kind dat Darija leert kan het Arabische schrift nog niet
vloeiend lezen. Een e-boek in het Darija is dan een boek dat niemand kan
lezen — de ouder niet, want die leest het schrift ook half, en het kind niet,
want dat is er nog niet.

**De oplossing:** maak er geen leesboek van maar een **luister-mee-boek**.
Dat is precies wat je app al goed doet en wat niemand anders heeft: een echte
Marokkaanse stem.

Elk verhaal krijgt vier lagen op dezelfde bladzijde:

1. het Arabische schrift
2. de klank in Latijnse letters, zodat de ouder het kán voorlezen
3. de betekenis in zijn eigen taal
4. **de opname** — een nummer per bladzijde, en de stem leest voor

De ouder leest niet vóór, hij luistert **mee**. Dat is de emotie die je
verkoopt: een vader van veertig die samen met zijn dochter voor het eerst een
Marokkaans verhaal hoort in de taal die hij zelf half kwijt is.

### Welke verhalen

Niet zelf verzinnen. **De verhalen die iedereen van zijn oma kent:**

- **Jha** (جحا) — de slimme dwaas, tientallen korte verhalen, overal in
  Marokko bekend, en grappig genoeg voor een kind van zeven
- **Aïcha Kandisha** — maar dan de zachte versie, want de echte is een
  nachtmerrie
- **Hdiddan**, de slimme herder
- verhalen rond de seizoenen: de olijvenoogst, de souq, Ramadan, het feest
- **Zeven steden, zeven verhalen** — één per stad: Fes, Marrakech,
  Chefchaouen, Essaouira, Tanger, Ouarzazate, Rabat. Dit is de sterkste reeks
  commercieel gezien: het is ook een reisboekje, en het kind dat deze zomer
  meegaat wil weten waar het heen gaat.

Dit zijn overgeleverde volksverhalen; je hervertelt ze zelf, met je eigen
woorden en je eigen stem. Zet er wel bij dat het een hervertelling is.

### De vorm staat er al

`npm run verhaalboek` maakt hem, op A5, uit de vier verhalen die al in de app
staan. Niet het product — de **vorm**: per regel een spoornummer, het schrift,
de klank en de betekenis onder elkaar, zodat je kunt zien of dit boek is wat
je voor je zag voordat er een euro naar een studio gaat.

```bash
npm run verhaalboek                       # de vier verhalen uit de app
npm run verhaalboek -- --verhaal jedda    # er een
npm run verhaalboek -- --taal fr
```

### Wat het kost en oplevert

Het maken van de PDF kost je niets: de pijplijn maakt hem uit de inhoud.

**En één cijfer dat de begroting bepaalt:** van de 38 verhaalregels die nu in
de app staan heeft er **één** een opname. De woorden en de losse zinnen zijn
ingesproken, de verhaalregels niet. Elk verhaal dat je verkoopt moet dus in
zijn geheel opgenomen worden.

**De kosten zitten in de opnames.** Tien verhalen van vierhonderd woorden is
een dag studio met dezelfde stem als in de app — en het moet dezelfde stem
zijn, anders klopt het niet meer met wat het kind kent. Reken op een paar
honderd euro. Dat is de enige echte investering in dit hele document.

| | |
|---|---|
| Losse deel | € 12,99 (PDF + audio) |
| De reeks van zes | € 39,99 |
| Gedrukt, later | € 19,95 per deel |

Tweeduizend verkochte delen is € 26.000. Prettig, maar niet je hoofdinkomen —
het abonnement blijft de motor. Wat dit wél doet: het maakt de band sterker,
en een ouder die een boek koopt zegt zijn abonnement niet op.

## 2b. Voor de kleintjes — de Atlasleeuw

Dit is sterker dan §2, en het is een ander boek voor een andere leeftijd.

**Prentenboeken voor 2 tot 8 jaar, in het Nederlands, met per bladzijde één
woord Darija.** Het kind hoeft niets te kunnen lezen en de ouder hoeft geen
Darija te kennen: hij leest het verhaal voor en struikelt één keer per
bladzijde over een woord dat hij zelf ook weer leert. De ontdekking van dat
woord ís het verhaal.

Waarom dit beter werkt dan het luister-mee-boek van §2:

- **De app begint rond zeven jaar.** Hier begint het bij twee. Dat is een
  nieuwe markt, en het is de markt die je al in huis hebt: het broertje van je
  gebruiker. Een ouder die het abonnement betaalt voor de oudste, koopt het
  boek voor de jongste.
- **De ouder kan het voorlezen.** Dat was de valkuil van een boek in het
  Darija; die is hier weg.
- **Twaalf woorden per boek** zijn twaalf woorden die al in `words.ts` staan
  en al zijn ingesproken. De QR-code achterin kost je dus niets.
- **Eén terugkerend figuur** maakt er een reeks van in plaats van een boek.

### Het figuur

Een **Atlasleeuw**, en die keuze is beter dan hij lijkt. Hij is het symbool
van Marokko — de nationale ploeg heet ernaar — hij is groot en zacht
tegelijk, en hij is in het wild uitgestorven. Dat laatste zeg je niet tegen
een kind van vier, maar het is wel precies hetzelfde verhaal als dat van de
taal: iets van thuis dat verdwijnt als niemand het doorgeeft.

Een naam met een echte Marokkaanse wortel is meer waard dan een verzonnen
klank. **Yuba** is mijn voorstel: naar Juba II, de Amazigh-koning die
regeerde vanuit Walili — dezelfde stad waarmee de geschiedeniskaarten in de
app beginnen. Twee lettergrepen, uit te spreken in alle zes de talen, en
geen enkele andere kinderreeks heet zo. Het alternatief is **Sbaa**, het
Darija-woord voor leeuw: elke Marokkaanse ouder glimlacht meteen, en het is
zelf al het eerste woordje.

En laat **Fnek**, de fennek uit de app, meereizen als zijn maatje. Dan
herkent een kind dat het boek kent de app, en andersom. Eén wereld, twee
producten.

### De reeks

Zes delen, elk twaalf woorden, elk een stuk van het land:

| Deel | Waar | Wat je leert |
|---|---|---|
| 1 | de medina van Fes | begroeten, brood, de ezel, de poort |
| 2 | het Atlasgebergte | sneeuw, geit, thee, koud |
| 3 | de zee bij Essaouira | vis, boot, meeuw, wind |
| 4 | de souq van Marrakech | hoeveel, duur, munt, afdingen |
| 5 | bij jeddti | couscous, vrijdag, oma, lekker |
| 6 | het feest | nieuw, cadeau, henna, feliciteren |

Tweeëzeventig woorden over de hele reeks — allemaal woorden die het kind
straks in de app terugziet.

### Wat het kost, eerlijk

De opmaak kost je niets; de tekeningen wel. **Een prentenboek heeft twaalf
tot zestien platen nodig**, en een illustrator rekent € 150 tot € 400 per
plaat. Dat is € 2.000 tot € 6.000 per deel, en dat is de enige echte drempel
in dit hele document.

Drie manieren eromheen, in volgorde van wat ik zou doen:

1. **Eén deel maken, niet zes.** Kijk of het verkoopt voordat je aan deel twee
   begint.
2. **Een Marokkaanse illustrator.** Goedkoper, en het klopt ook beter — dit is
   hun leeuw.
3. **Een student van een kunstacademie** die een portfolio wil. Vraag om drie
   proefplaten voordat je de hele reeks gunt.

Wat ik **niet** zou doen: platen laten genereren. De hele belofte van dit merk
is dat het echt is — een echte stem, een echte taal, een echte oma. Getekend
door een mens hoort in datzelfde rijtje, en ouders zien het verschil.

| | |
|---|---|
| Softcover, print-on-demand | kostprijs € 6–9, verkoop € 14,95 |
| Hardcover vanaf 1.000 stuks | kostprijs € 2,50–4, verkoop € 17,95 |
| Als e-boek erbij | € 7,95, geen risico |

Begin bij print-on-demand: geen voorraad, geen investering. Verkoopt een deel
er driehonderd, dan laat je hem in één keer drukken en verdubbelt je marge.

### Op de website

Een eigen ingang, precies zoals je zei: **"Voor de kleintjes — 2 tot 8 jaar"**.

Dat is niet alleen een winkelrubriek, het is een tweede voordeur. Een ouder
met een kind van drie kan nu niets met de app en gaat weg. Straks koopt hij
een boek, komt hij op je lijst, en over vier jaar heeft hij een abonnement.

## 3. De naam van je kind in Arabisch schrift

Dit is het idee met de hoogste verhouding tussen gevoel en moeite, en het kan
vóór de verhalen af zijn.

**Op de website**: je typt de naam van je kind, en je ziet hem in Arabische
kalligrafie verschijnen.

- **gratis** als afbeelding om te downloaden en te delen
- **€ 24,95** als poster, gedrukt en thuisbezorgd

Waarom dit werkt: het is van hén. Een moeder die *أمير* ziet verschijnen
stuurt dat binnen een minuut naar de familiegroep, en daar staat jouw naam
onder. Dat is precies de motor uit `LANCERING.md` §4 — maar dan zonder dat je
iets hoeft te vragen.

**De valkuil, en die is serieus:** een naam verkeerd spellen is beschamend, en
automatisch omzetten van Latijn naar Arabisch gaat mis bij precies de namen
die ertoe doen. Dus: **een lijst van de tweehonderd meest voorkomende
Marokkaanse namen, met de hand nagekeken**, en voor de rest een knop
"mijn naam staat er niet bij" waarmee iemand hem aanvraagt. Liever tweehonderd
namen die kloppen dan tienduizend die soms fout zijn.

De site draait op Cloudflare Workers, dus dit kan daar: de naam erin, de
afbeelding eruit. Geen database, geen account.

## 4. Wat je laat drukken

Dit is waar de marge zit, en waar een grootouder zijn portemonnee trekt. De
inhoud staat allemaal al in de repo.

| Product | Prijs | Waar de inhoud vandaan komt |
|---|---|---|
| **Alfabetposter** — 28 letters, elk in zijn drie vormen | € 19,95 | `src/content/alphabet.ts` |
| **Woordkaarten** — 100 kaarten, schrift + klank + plaatje | € 24,95 | `src/content/words.ts` |
| **Schrijfwerkboek** — de letters natekenen, A4 | € 14,95 | de bonusronde die al bestaat |
| **Ramadankalender** — dertig vakjes, elke dag een woord | € 12,95 | `words.ts` |

Alles via print-on-demand: geen voorraad, geen risico, je betaalt pas als er
besteld wordt. De marge ligt rond de helft.

**De Ramadankalender verdient een aparte zin.** Ramadan begint in februari
2027 — net na je eerste negentig dagen. Dat is in deze gemeenschap het moment
waarop iets voor kinderen gekocht wordt, en een kalender met elke dag een
woord Darija is een product dat zichzelf uitlegt. Begin in december met maken.

## 5. De cadeaubox — en waarom een cadeaubon niet kan

Grootouders willen het abonnement cadeau doen. Dat kán technisch niet: je app
heeft geen accounts (met opzet), en Apple en Google laten je een abonnement
niet verkopen als bon.

Wat wél kan, en beter is:

**Een doos van € 49,95** met de alfabetposter, de woordkaarten, en een kaartje
waarop een code staat voor **drie maanden gratis**. Die code is bij Apple een
*offer code* en bij Google een *promo code* — gratis periodes mogen ze
uitgeven, en dat is precies wat je nodig hebt. Het geld zit in de doos; de
toegang is het cadeau erin.

Oma betaalt vijftig euro, het kind pakt iets uit, en na drie maanden begint er
een abonnement. Dat is een betere verkoop dan welke advertentie ook.

Hiervoor is die knop **"Ik heb een code"** in de app nodig. Zonder die knop
werkt deze hele paragraaf niet.

## 6. Voor de weekendscholen — waar het echte geld ligt

`LANCERING.md` §8 gaat over scholen als kanaal. Ze zijn ook een klant.

Een weekendschool met zestig leerlingen die Arabische les geeft, heeft geen
lesmateriaal voor gesproken Darija. Jij hebt het.

**Het pakket per school, per jaar:**

- toegang voor de leraar en zijn klas
- zestig werkboeken, gedrukt
- de alfabetposter voor het lokaal
- een handleiding van acht bladzijden: wat behandel je wanneer

Reken € 15 tot € 25 per leerling per jaar. **Twintig scholen × zestig
leerlingen × € 20 = € 24.000**, in één seizoen, van twintig gesprekken.

En elk van die zestig gezinnen heeft nu je merk in huis liggen.

## 7. Hoe je dit verkoopt zonder backend en zonder btw-drama

Dit is het stuk dat mensen onderschat en waar ze twee maanden verliezen.

**Digitale producten aan Europese consumenten betekent btw in het land van de
koper.** Een Nederlandse eenmanszaak die een PDF verkoopt aan een Franse
ouder moet Franse btw afdragen — via de OSS-regeling van de Belastingdienst.
Dat kan, maar het is elk kwartaal werk.

**Of je laat een ander de verkoper zijn.** Bij een *merchant of record* —
Lemon Squeezy, Paddle, Gumroad — verkoopt dát bedrijf aan de klant en ben jij
hun leverancier. Zij innen en dragen de btw in alle landen af, zij leveren het
bestand, zij doen de terugbetalingen. Jij krijgt één uitbetaling per maand en
hoeft je nergens te registreren.

Ze houden 5 tot 10 % in. Voor een paar honderd verkopen per maand is dat de
goedkoopste boekhouder die je kunt krijgen.

| Wat | Hoe |
|---|---|
| PDF's en audio | merchant of record, hosted afrekenpagina, één link vanaf je site |
| Posters, kaarten, boxen | print-on-demand met eigen afrekening (fysiek, dus gewone btw) |
| De gratis naamafbeelding | Cloudflare Worker, geen betaling, geen account |

De website blijft daarmee wat hij is: gewone HTML zonder backend. Elke
"kopen"-knop is een link naar een afrekenpagina die iemand anders beheert.

## 8. Wat ik zou doen, in deze volgorde

1. **De knop "Ik heb een code"** in de app. Zonder die knop werken de
   influencers (§LANCERING 9), de scholen (§6) en de cadeaubox (§5) geen van
   drieën. Eén dag werk.
2. **De naamposter**, gratis versie eerst. Dat is marketing die zichzelf
   betaalt en het bouwt de lijst waar je in §3 op leunt.
3. **Eén verhaal** als proef — Jha, in het Nederlands, met audio. Kijk of het
   verkoopt voordat je een dag studio boekt voor tien.
4. **Het schoolpakket**, zodra de eerste drie scholen ja hebben gezegd.
5. **De Ramadankalender**, te beginnen in december.
6. De rest van de reeks, en de gedrukte boeken, in het tweede kwartaal.

Alles hierboven kan wachten tot de app live is. Alleen punt 1 niet: die knop
blokkeert drie andere dingen tegelijk.
