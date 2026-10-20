# Dilimiz live krijgen — Duitsland, € 5,99 per maand

> **Besloten op 20 oktober 2026:** zo snel mogelijk live, te beginnen in
> Duitsland, één abonnement van € 5,99 per maand, maandelijks opzegbaar. Geen
> website, geen iOS bij de start. Verspreiding via Facebook-groepen.

Dit document is de volgorde. Alles wat met een **jij** staat kan alleen de
eigenaar doen; de rest is gedaan of is een opdracht.

---

## Wat af is

| | |
|---|---|
| De app zelf | Welkom → pad → les → oefenen → voortgang → ouderdeel |
| Prijs en plan | Eén maandplan, € 5,99, maandelijks opzegbaar |
| De koopstroom | Aangesloten op `cordova-plugin-purchase`, met herstel en nette afhandeling van afbreken en mislukken |
| Android-project | `android/`, app-id `app.dilimiz.learn` |
| Pictogram en startscherm | Eigen merkteken, `npm run beeld` |
| Winkelbeelden | 512×512, 1024×500, zes schermafdrukken |
| Privacyverklaring | `npm run privacy -- --mail …` |
| Ondertekenen en bouwen | `npm run sleutel`, `npm run aab` |

## Wat ik niet heb kunnen testen

Eerlijk, want hier gaat het mis als het misgaat:

1. **De echte koop.** `cordova-plugin-purchase` bestaat alleen op een toestel.
   De code is geschreven en de nagebootste winkel is getest, maar er is nooit
   een echte euro doorheen gegaan. **Koop hem één keer zelf** met een
   testaccount vóór de eerste gebruiker dat doet — zie stap 7.
2. **De bouw van de bundle.** Er staat geen Android SDK in de omgeving waar ik
   werkte, dus `npm run aab` is nooit helemaal afgelopen. De controles ervóór
   wel (geen sleutel → nette melding, geen SDK → nette melding).
3. **De app op een echt toestel.** Alles is getest in een desktopbrowser op
   telefoonformaat, niet op Android.

---

## De volgorde

### 1. Google Play-ontwikkelaarsaccount · **jij**

€ 25, eenmalig. Reken op **een paar dagen tot twee weken** voor de
identiteitscontrole; sinds 2023 controleert Google ook een adres.

> Dit is de langste wachttijd in het hele traject. Begin hiermee, vandaag,
> vóór al het andere. Alles hieronder kan terwijl je wacht.

Je registreert je als **particulier of als bedrijf**. Voor betaalde apps in de
EU moet je daarnaast je status als "handelaar" opgeven, met adres — en dat
adres wordt openbaar getoond in de winkel. Weet dat vóór je je thuisadres
invult.

Daarna heb je ook een **betaalprofiel** nodig om geld te kunnen ontvangen. Dat
is een apart formulier en ook een paar dagen.

### 2. Het e-mailadres · **jij**

Eén adres dat je werkelijk leest. Het komt op drie plekken: in de
privacyverklaring, in de winkelvermelding, en als het adres waarop kopers
antwoorden.

### 3. De inhoud laten nakijken · **jij**

```powershell
npm --prefix <projectmap> run nakijklijst
```

Stuur `nakijklijst.md` naar iemand met Turks als moedertaal, het liefst een
docent. **Dit is het grootste risico van de hele lancering**, en het kost die
persoon één middag.

Duitsland is de grootste Turkstalige markt van Europa. Dat is het argument om
daar te beginnen, en het is precies waarom een fout in les één daar het meest
kost: de ouder die betaalt is vaak de ouder die zelf Turks spreekt.

Zet daarna per bestand `klaar: true`, `door` en `op` in
`src/content/nakijken.ts`. De app laat tot die tijd op het ouderscherm zien dat
de inhoud nog niet is nagekeken — dat is eerlijk, en het is geen vervanging
voor het nakijken.

### 4. De privacyverklaring online · **jij**

```powershell
npm --prefix <projectmap> run privacy -- --mail jouw@adres.nl
```

Dat schrijft `winkel/privacy/index.html` — vier talen, één bestand. Zet hem
online; de snelste gratis manier zonder website:

1. Ga naar `https://app.netlify.com/drop`
2. Sleep de map `winkel/privacy` erin
3. Je krijgt meteen een adres

Bewaar dat adres. Google weigert de app zonder.

### 5. De upload-sleutel

```powershell
npm --prefix <projectmap> run sleutel
```

De sleutel komt in `Documents\Dilimiz-sleutel`, met het wachtwoord ernaast.

**Kopieer die map meteen naar een tweede plek.** Niet dezelfde computer. Raak
je hem kwijt, dan kun je de app nooit meer bijwerken — Google kan hem opnieuw
instellen, maar dat is een supportzaak van dagen.

### 6. De app aanmaken in de Play Console · **jij**

Naam: **Dilimiz**. Pakketnaam: **`app.dilimiz.learn`** — die kan later niet
meer veranderen.

Vul daarna **App-inhoud** in. Dit is het deel waar de meeste tijd in gaat
zitten, en waar afwijzingen vandaan komen:

| Onderdeel | Wat je invult |
|---|---|
| Privacybeleid | Het adres uit stap 4 |
| Advertenties | **Nee**, de app bevat geen advertenties |
| App-toegang | Alle functionaliteit beschikbaar zonder speciale toegang |
| Inhoudsbeoordeling | Vragenlijst invullen: educatief, geen geweld, geen gebruikersinteractie, geen locatiedeling |
| Doelgroep | **Leeftijdsgroepen inclusief kinderen** — zie hieronder |
| Gegevensveiligheid | Zie de tabel hieronder |
| Overheids-app | Nee |
| Financiële functies | Nee |

#### Doelgroep en Families-beleid

De app is voor kinderen, dus geldt het **Families-beleid** van Google. Dat
betekent onder meer: geen advertenties, geen analytics die kinderen volgt, en
in-app-aankopen achter een ouderpoort. Daar voldoet de app aan — de poort zit
voor elke koop en voor elke link naar buiten.

> **Controleer de actuele eisen zelf**, in de Play Console onder
> *Beleidsregels → Families*. Deze regels veranderen, en wat hier staat is de
> stand van het ontwerp en niet de stand van het beleid.

#### Gegevensveiligheid — precies deze antwoorden

De app verzamelt niets en verstuurt niets. Dat is te controleren met
`npm test` (`src/engine/privacy.test.ts`).

| Vraag | Antwoord |
|---|---|
| Verzamelt je app gebruikersgegevens of deelt die? | **Nee** |
| Worden gegevens versleuteld tijdens verzending? | N.v.t. — er wordt niets verzonden |
| Kunnen gebruikers vragen om gegevens te verwijderen? | **Ja** — in de app, onder "Voor ouders" |

De naam en de voortgang die het kind invult tellen niet als "verzameld": ze
blijven op het toestel en bereiken ons nooit. Google vraagt expliciet naar
*verzamelen* en *delen*, en dat gebeurt geen van beide.

> Vult iemand hier later toch iets in dat wél verzamelt — een analytics-pakket,
> een crashmelder — dan klopt dit formulier niet meer, en daar controleert
> Google op. `privacy.test.ts` faalt dan ook.

### 7. Het abonnement aanmaken · **jij**

Play Console → **Verdienen → Abonnementen → Abonnement maken**.

| Veld | Waarde |
|---|---|
| Product-id | **`app.dilimiz.monthly`** — exact zo, hij staat in de code |
| Naam | Dilimiz |
| Facturering | Maandelijks |
| Prijs | **€ 5,99** voor Duitsland |
| Gratis proefperiode | **Geen** |

Over die laatste twee:

- **De prijs is inclusief btw.** Google rekent de Duitse 19% eruit; wat je
  invult is wat de koper ziet. € 5,99 betekent dus ongeveer € 5,03 omzet vóór
  Google's aandeel.
- **Geen proefperiode bij de start.** De vier gratis lessen zijn het proberen.
  Dat scheelt een instelling die goed moet staan voordat er betaald verkeer op
  komt — en bij de vorige app is juist dáár de duurste fout gemaakt: de proef
  stond wekenlang op één plan terwijl het scherm hem aan iedereen beloofde.

  Wil je later wél een proefperiode: zet hem in de Play Console aan en de app
  past zich vanzelf aan. **Er hoeft geen regel code voor te veranderen**, want
  het scherm leest de winkel en belooft niets wat die niet meldt.

**Koop hem daarna één keer zelf.** Zet je eigen account bij *Instellingen →
Licentietests*, installeer de app uit de testtrack en doorloop de koop. Dat is
de enige manier om te zien dat de koopstroom werkt, want ik heb hem niet op een
toestel kunnen draaien.

### 8. De bundle bouwen

```powershell
npm --prefix <projectmap> run beeld
npm --prefix <projectmap> run aab
```

De eerste maakt het pictogram en het startscherm; de tweede bouwt de bundle en
hoogt de versiecode op. Het bestand komt in
`android\app\build\outputs\bundle\release\app-release.aab`.

Heb je nog geen Android SDK, dan zegt het script dat, met de ene stap die je
moet doen: Android Studio installeren en het project in `android\` één keer
openen.

### 9. De winkelvermelding · **jij**

Schermafdrukken en beelden staan klaar in `winkel/` (`npm run schermen`
vernieuwt ze). Google wil er minstens twee; neem ze alle zes.

De teksten staan hieronder, klaar om te plakken.

### 10. Eerst open testen, dan productie

Zet de eerste versie op **Testen → Open testen** en niet meteen op Productie.

Waarom: een open test krijgt een gewoon Play-adres dat je kunt delen — precies
wat je nodig hebt voor Facebook-groepen — maar een afwijzing of een slechte
eerste indruk raakt je hoofdvermelding niet. Je kunt er ook gewoon in laten
betalen.

Reken op **een paar dagen tot een week** beoordeling voor de eerste versie.
Een kinderapp wordt strenger bekeken dan gemiddeld.

Staat het een week goed en zijn de eerste reacties uit de groepen bruikbaar,
dan promoveer je dezelfde bundle naar Productie.

---

## De winkelteksten

### Duits — de lanceertaal

**Titel** (max. 30 tekens)
```
Dilimiz – Türkisch für Kinder
```

**Korte beschrijving** (max. 80 tekens)
```
Türkisch lernen in kurzen Lektionen – für zu Hause und für die Türkei.
```

**Vollständige Beschreibung**
```
Dilimiz heißt „unsere Sprache". Die App ist für Kinder, die Türkisch hören,
aber nicht sprechen – und für Eltern, die die Sprache weitergeben möchten,
ohne dass es zur zweiten Arbeit wird.

KURZE LEKTIONEN
Fünf bis acht Minuten. Eine Lektion ist fertig, bevor die Aufmerksamkeit
aufgebraucht ist.

SPRECHEN STATT NUR ERKENNEN
Schon in der ersten Lektion wird getippt und gesprochen, nicht nur angetippt.
Wer Türkisch versteht, aber nicht spricht, braucht keine Erkennungsübungen.

DIE SECHS BUCHSTABEN, DIE ANDERS KLINGEN
c, ç, ğ, ı, ö, ş, ü – daran scheitert fast jedes Kind, das mit Deutsch
aufwächst. Dilimiz übt sie mit echten Wortpaaren: kıl und kil, koy und köy.
Danach kannst du jedes türkische Wort vorlesen, denn Türkisch schreibt man
genau so, wie man es spricht.

WÖRTER, DIE BLEIBEN
Wörter kommen zurück, kurz bevor man sie vergessen würde.

FAMILIENWORTSCHATZ
Begrüßen, sich vorstellen, Zahlen, und die ganze Familie: anneanne und
babaanne, teyze und hala, dayı und amca. Vier Wörter, wo Deutsch nur Onkel
und Tante hat.

FÜR ELTERN
Kein Konto. Kein Server. Keine Werbung. Kein Tracking. Alles bleibt auf dem
Gerät, und im Elternbereich können Sie es ansehen, sichern und löschen.
Käufe liegen hinter einer Elternsperre.

Die ersten vier Lektionen sind kostenlos. Danach 5,99 € im Monat,
monatlich kündbar.

Diese App befindet sich in Entwicklung. Wir freuen uns über Rückmeldungen –
besonders von Familien, die Türkisch sprechen.
```

> Die laatste alinea staat er met opzet: zolang de inhoud niet is nagekeken en
> de stemmen niet zijn opgenomen, is "in ontwikkeling" de waarheid. Hij mag
> weg zodra stap 3 en de opnames klaar zijn.

### Turks — voor de ouders in de groepen

**Kısa açıklama**
```
Çocuklar için kısa derslerle Türkçe – evde ve Türkiye'de kullanmak için.
```

### Nederlands

**Korte omschrijving**
```
Turks leren in korte lessen – voor thuis en voor de zomer in Turkije.
```

---

## Voor de Facebook-groepen

Niet verkopen maar laten zien. In een ouder-groep werkt een vraag beter dan een
aankondiging, en een app die eerlijk zegt dat hij nieuw is krijgt bruikbaardere
reacties dan een app die doet alsof hij af is.

**Duits**
```
Unsere Kinder verstehen Türkisch, antworten aber auf Deutsch. Kennt ihr das?

Ich habe eine kleine App dafür gebaut: Dilimiz. Kurze Lektionen, und von
Anfang an selbst sprechen statt nur erkennen. Mit den sechs Buchstaben, an
denen Kinder hier immer hängen bleiben – c, ç, ğ, ı, ö, ş.

Die ersten vier Lektionen sind kostenlos, ihr könnt es also einfach
ausprobieren. Sie ist neu, also sagt mir bitte, was fehlt oder falsch ist.

[Play-Store-Link]
```

**Turks**
```
Çocuklarımız Türkçe anlıyor ama Almanca cevap veriyor. Tanıdık geldi mi?

Bunun için küçük bir uygulama yaptım: Dilimiz. Kısa dersler, ve en baştan
itibaren tanımak yerine konuşmak. Burada büyüyen çocukların hep takıldığı altı
harfle birlikte: c, ç, ğ, ı, ö, ş.

İlk dört ders ücretsiz, deneyebilirsiniz. Yeni bir uygulama, o yüzden eksik
veya yanlış bulduğunuz şeyleri bana yazın lütfen.

[Play Store bağlantısı]
```

> **Lees de regels van de groep voordat je post.** Veel diaspora-groepen staan
> geen promotie toe, en één verwijdering kost je de hele groep. Vraag de
> beheerder vooraf; dat kost een bericht en levert vaak een vastgezet bericht
> op in plaats van een verwijderd bericht.

---

## Wat er ná de eerste versie moet

In deze volgorde, en geen ervan blokkeert de eerste upload:

1. **De opnames** (`npm run opnamelijst`, 141 per stem). Tot die tijd hoort een
   kind een computerstem, en die spreekt `ğ` verkeerd uit. De app zegt dat er
   zelf bij.
2. **De microfoon aansluiten.** De spreekoefening staat er wel en neemt nu
   niets op.
3. **Units 4 tot 6** — thuis, eten, school.
4. **iOS.** Een Mac nodig, en een tweede winkelaccount van € 99 per jaar.
5. **Een jaarplan**, als het maandplan loopt.

## Wat je in de eerste week meet

Niet downloads. Deze drie, en ze staan in de Play Console:

1. **Komt iemand tot les 3 binnen twee dagen?** Zo niet, dan deugt de
   onboarding of de eerste les niet, en is de rest niet interessant.
2. **Is iemand op dag 7 terug?** Dat zegt of de herhaling werkt.
3. **Koopt iemand na de vier gratis lessen?** Dat zegt of de belofte geloofd
   wordt.

De vorige app stond na een halfjaar op 119 downloads bij een goed product. De
conclusie daar was dat bereik het knelpunt is en niet het product. Die les
geldt hier vooraf: de Facebook-groepen zijn het experiment, niet de app.
