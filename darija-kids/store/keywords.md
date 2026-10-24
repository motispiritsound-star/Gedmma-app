# Vindbaarheid: titels, ondertitels en zoekwoorden

Wat je in de twee consoles invult. De App Store en Google Play werken
verschillend: Apple heeft een apart veld voor zoekwoorden dat niemand ziet,
Google leest gewoon je beschrijving. Daarom staan ze hier apart.

## App Store

Apple geeft je drie velden die meetellen voor zoeken: **naam** (30 tekens),
**ondertitel** (30 tekens) en **zoekwoorden** (100 tekens, alleen voor Apple).
Herhaal in de zoekwoorden nooit iets dat al in de naam of ondertitel staat —
dat is verspilde ruimte. Geen spaties na de komma's, ook dat is ruimte.

| Taal | Naam | Ondertitel |
|---|---|---|
| Nederlands | Darijaforkids | Marokkaans-Arabisch leren |
| Français | Darijaforkids | Apprendre l'arabe marocain |
| Deutsch | Darijaforkids | Marokkanisch-Arabisch lernen |
| Español | Darijaforkids | Aprende árabe marroquí |
| Italiano | Darijaforkids | Impara l'arabo marocchino |
| English | Darijaforkids | Learn Moroccan Arabic |

**In geen van deze zes staat nog een woord voor kind.** Dat is geen smaak maar
een eis: Apple wees versie 1.0 af op richtlijn 2.3.8 omdat de Engelse
ondertitel *For the kids, quietly for you* zei dat de app voor kinderen is,
terwijl hij niet in de Kinderen-categorie is ingediend. Wie hier ooit weer
"voor kids" neerzet, krijgt dezelfde afwijzing — zie `docs/APPLE-2.3.8.md`.

De zoekwoorden mogen die woorden wél houden. Apple noemt in zijn herstelstap
precies vier plekken: de naam, de ondertitel, het pictogram en de
schermafdrukken. Zoekwoorden ziet niemand, en "arabisch voor kinderen" is
precies waar een ouder op zoekt.

**Zoekwoorden** (elk binnen de 100 tekens):

```
nl: darija,marokko,kinderen,kind,uitspraak,alfabet,moedertaal,tweetalig,taal,school,woorden,gezin
fr: darija,maroc,enfants,enfant,prononciation,alphabet,bilingue,maternelle,langue,école,mots,famille
de: darija,marokko,kinder,kind,aussprache,alphabet,muttersprache,zweisprachig,sprache,schule,wörter
es: darija,dariya,marruecos,niños,pronunciación,alfabeto,bilingüe,materna,idioma,escuela,palabras
it: darija,marocco,bambini,pronuncia,alfabeto,bilingue,madrelingua,lingua,scuola,parole,famiglia,parlare
en: darija,morocco,kids,children,pronunciation,alphabet,bilingual,heritage,language,school,words,family
```

**Deze lijst stond hierboven zijn eigen regel te overtreden.** De eis "herhaal
nooit iets dat al in de naam of ondertitel staat" is juist, maar de vorige
lijst begon in elke taal met precies die drie woorden: `marokkaans,arabisch`
plus `leren`, terwijl de ondertitel *Marokkaans-Arabisch leren* heet. In alle
zes de talen hetzelfde, want elke ondertitel bevat die drie begrippen.

Nagemeten op het Nederlandse veld: **26 van de 91 tekens** gingen op aan
woorden die Apple al had. Bijna een derde.

Wat er op 24 oktober werkelijk in de console stond was nog een slag slechter
dan de lijst hierboven:

```
darija,marokkaans,arabisch,marokko,taal,kinderen,leren,woordenschat,arabisch schrift,gratis
```

Daar zitten drie dingen in die weg moeten:

- `arabisch schrift` — een spatie kost een teken, en `arabisch` stond er al
  twee keer in (los én in de ondertitel).
- `gratis` — een van de meest beconcurreerde woorden in elke winkel, en het
  belooft iets wat een app met een abonnement niet is.
- `school`, `uitspraak`, `alfabet` en `gezin` ontbraken, terwijl dat precies de
  woorden zijn waarop iemand zoekt die weet wat hij wil.

De nieuwe lijst gebruikt de vrijgekomen ruimte voor termen met echte bedoeling
erachter: **moedertaal** en **tweetalig** zijn hoe een ouder in de diaspora
zijn eigen vraag formuleert, en **uitspraak** en **alfabet** zijn wat deze app
heeft en de meeste andere niet.

`src/site/zoekwoorden.test.ts` bewaakt de lengte en de overlap, zodat dit niet
nog een keer stilletjes terugkomt.

**Zoekwoorden veranderen kan alleen bij een nieuwe versie.** 1.5 is op 24
oktober ingestuurd en staat in beoordeling; deze lijst gaat dus mee met 1.6.

Vergeet niet dat Apple ook zoekt op de **categorie** en op de naam van je
uitgever. Kies **Onderwijs** als hoofdcategorie en **Naslagwerken** als tweede.

**Geschiedenis als tweede ingang.** De veertien filmpjes maken de app ook
vindbaar voor mensen die niet naar een taalcursus zochten maar naar iets over
Marokko voor hun kind. Dat is een ander en veel groter publiek, en er is bijna
geen concurrentie op. Honderd tekens zijn vol, dus dit gaat niet in het
zoekwoordveld erbij — het gaat in de **beschrijving** (die Google leest) en in
de **promotietekst** (die Apple toont). De namen zelf zijn de zoektermen:
Ibn Battuta, Fatima al-Qarawiyyin, Tariq ibn Ziyad, Amazigh, Tifinagh. Wie daar
op zoekt en jouw app vindt, vindt iets wat niemand anders maakt.

Overweeg voor versie 1.1, als de eerste cijfers binnen zijn, één taal om te
testen met een ondertitel die de geschiedenis noemt in plaats van de leeftijd —
bijvoorbeeld `Darija & Marokko voor kids`. Verander nooit meer dan één veld
tegelijk, anders weet je niet wat het deed.

## Google Play

Google leest de titel (30 tekens), de korte beschrijving (80 tekens) en de
volledige beschrijving (4000 tekens). Zoekwoorden stop je daar gewoon in, in
hele zinnen — een lijst losse woorden werkt averechts.

| Taal | Titel | Korte beschrijving |
|---|---|---|
| Nederlands | Darijaforkids: Marokkaans | Leer Darija: Marokkaans-Arabisch voor kinderen, met uitspraak |
| Français | Darijaforkids : marocain | Apprends le darija : l'arabe marocain pour enfants, prononcé |
| Deutsch | Darijaforkids: Marokkanisch | Lerne Darija: marokkanisches Arabisch für Kinder, mit Aussprache |
| Español | Darijaforkids: marroquí | Aprende dariya: árabe marroquí para niños, con pronunciación |
| Italiano | Darijaforkids: marocchino | Impara il darija: arabo marocchino per bambini, con la pronuncia |
| English | Darijaforkids: Moroccan | Learn Darija: Moroccan Arabic for children, spoken aloud |

De volledige beschrijvingen staan per taal klaar in `listing.<taal>.md`.

## Waar mensen echt op zoeken

Dit zijn de zoektermen waar deze app op moet uitkomen, ongeveer op volgorde van
hoe vaak ze voorkomen:

1. *darija leren* / *apprendre le darija* / *darija lernen* / *imparare il darija*
2. *marokkaans leren* / *marocain apprendre* / *marocchino imparare*
3. *marokkaans arabisch kinderen*
4. *arabisch voor kinderen* — hier concurreer je met apps voor Standaardarabisch
5. *darija app*
6. *marokkaanse taal app*

Nummer 4 is de grootste groep en de moeilijkste: mensen die "Arabisch" zoeken
krijgen tien apps die iets anders leren. Zorg dat in je eerste regel altijd het
verschil staat — *Darija, niet Standaardarabisch* — want dat is precies waar
iemand naar zoekt zonder het zo te noemen.

## Wat je niet moet doen

- Namen van andere apps in je zoekwoorden zetten. Beide winkels halen je
  listing eruit.
- "gratis" in de titel als er een abonnement in zit.
- Beloven dat een kind vloeiend wordt. Dat is niet waar en het valt op.
