# Lanceren

Eén lijst, van "de app is af" tot "hij staat in de winkel". Alles wat de code
kan doen is gedaan; wat hier overblijft is wat een mens met een bankrekening
en een paspoort moet doen.

Reken op **vier tot zes weken** tussen je eerste account en je eerste
downloader. Niet omdat het werk zoveel is, maar omdat Google sinds 2024 van
nieuwe persoonlijke accounts eist dat twaalf testers je app **veertien dagen
aaneengesloten** in een gesloten test hebben gehad vóór je mag publiceren. Die
twee weken begin je dus als eerste, niet als laatste.

---

## 0. Vandaag nog: de twee dingen die alles blokkeren

**Vul `src/content/operator.ts` in.** Naam, e-mailadres en land van de
uitgever. Zolang dat leeg is staat er een waarschuwing op je privacy- én
voorwaardenpagina, en beide winkels weigeren een app zonder werkende
contactgegevens.

```ts
export const OPERATOR = {
  name: 'Jouw naam of bedrijfsnaam',
  email: 'hallo@jouwdomein.nl',
  country: 'Nederland',
}
```

**Zet de website online.** Beide winkels willen een privacy-URL die werkt, en
Apple wil daarnaast een URL met je voorwaarden. Die twee pagina's zitten al in
de app: zodra de site staat zijn het `https://jouwdomein.nl/privacy` en
`https://jouwdomein.nl/voorwaarden`. Hoe je hem online zet staat in
[DEPLOY.md](DEPLOY.md) — met een gratis Netlify- of Vercel-account ben je in
een kwartier klaar.

---

## 1. Inschrijven en accounts

| Wat | Waar | Kost | Duurt |
|---|---|---|---|
| KvK-inschrijving | kvk.nl | € 82,25 | een afspraak, daarna direct |
| Google Play Console | play.google.com/console | € 22 eenmalig | 1–2 dagen verificatie |
| Apple Developer Program | developer.apple.com | € 99 per jaar | 1–2 dagen, soms langer |

Een KvK-nummer is nodig zodra je structureel verkoopt. Zonder inschrijving kun
je wel een gratis app publiceren, maar geen abonnement — beide winkels vragen
om belastinggegevens die je als particulier niet kunt geven.

Voor Apple heb je bovendien een **Mac** nodig. Die is niet te omzeilen: alleen
Xcode kan een iOS-app ondertekenen en inleveren. Heb je er geen, dan zijn de
opties: er een lenen, een Mac in de cloud huren (MacStadium, ± $ 60 per maand,
je hebt hem één dag nodig), of met Android beginnen en iOS later doen.

---

## 2. Het abonnement aanmaken

Volledig uitgeschreven in [PAYMENTS.md](PAYMENTS.md). In het kort, in beide
consoles hetzelfde:

Er zijn **twee** producten, in dezelfde abonnementsgroep:

| Product-id | Duur | Prijs | Naam voor de koper |
|---|---|---|---|
| `app.darijakids.yearly` | 1 jaar, verlengt automatisch | € 59,88 (Apple: € 59,99) | Een jaar volledige toegang |
| `app.darijakids.monthly` | 1 maand, verlengt automatisch | € 6,99 | Volledige toegang per maand |

Allebei met **3 dagen gratis**. De ids moeten exact zo, anders vindt de code ze
niet. Zelfde groep, zodat overstappen van maand naar jaar geen dubbele
afschrijving oplevert.

Koppel in dezelfde consoles je bankrekening en vul je belastinggegevens in.
Zonder dat wordt er niets uitbetaald, ook al verkoop je.

---

## 3. Wat je uploadt

Alles staat klaar in `store/`. Genereer de beelden opnieuw als je iets aan de
app verandert:

```bash
npm run build && npm run preview   # in een tweede venster laten draaien
npm run screenshots                # store/screenshots/<taal>/<toestel>/
npm run marketing                  # store/marketing/<taal>/
npm run intro                      # store/video/<taal>/ — duurt een kwartier
```

`npm run intro` start zijn eigen server, fotografeert de app en neemt de
introfilm op met geluid. Controleer een opname daarna met
`node scripts/checkvideo.mjs store/video/nl/intro-appstore.mp4`: die zegt hoe
lang hij is, hoe groot, en of er echt geluid op staat.

| Winkel | Wat | Vandaan |
|---|---|---|
| Beide | App-icoon 1024×1024 | `assets/icon.png` |
| Beide | Beschrijvingen in 5 talen | `store/listing.<taal>.md` |
| Beide | Titel, ondertitel, zoekwoorden | `store/keywords.md` |
| App Store | iPhone 6.9" (1290×2796) | `store/screenshots/<taal>/iphone/` |
| App Store | iPad 13" (2048×2732) | `store/screenshots/<taal>/ipad/` |
| App Store | App preview 886×1920, 15–30 s | `store/video/<taal>/intro-appstore.mp4` |
| App Store | Privacy-URL en voorwaarden-URL | je eigen site |
| Play | Telefoon (1080×1920) | `store/screenshots/<taal>/play/` |
| Play | Tablet 7" en 10" | `store/screenshots/<taal>/play-7/` en `play-10/` |
| Play | Feature graphic 1024×500 | `store/marketing/<taal>/feature-graphic.png` |
| Play | Promotievideo (YouTube-link) | zet `store/video/<taal>/intro-breed.mp4` op YouTube |
| Play | Privacy-URL | je eigen site |

De volgorde van de schermafbeeldingen is de volgorde van de bestandsnamen. De
eerste twee zijn de enige die de meeste mensen zien — daar staat niet voor
niets het leerpad en het alfabet.

De App Store wil een app preview van 15 tot 30 seconden; de onze duurt 27,5 en
staat in 886×1920, precies wat de 6.9"-sleuf vraagt. Google Play neemt geen
bestand aan maar een YouTube-link: zet `intro-breed.mp4` daar neer als niet-
vermelde video en plak de link in de Play Console. De vierkante en de verticale
versie zijn voor Instagram, Facebook, TikTok en advertenties — die horen niet
bij een winkel, maar wel bij een lancering.

---

## 4. De formulieren die niemand leuk vindt

**Google Play → Data safety.** Geen gegevens verzameld, geen gegevens gedeeld.
Dat is letterlijk waar. De enige vraag waar je even bij nadenkt: spraakherkenning
is in de Android-webweergave niet beschikbaar, dus de app vraagt geen
microfoontoestemming.

**Google Play → Doelgroep.** Vink de leeftijdsgroepen onder 13 aan. Daarmee val
je onder het **Families-beleid**: geen advertenties en geen analytics van
derden (die zitten er niet in), en in-app-aankopen mogen, mits de prijs vóór de
aankoop in beeld staat en er een ouderpoort voor zit. Dat is precies hoe het
abonnementsscherm gebouwd is.

**Google Play → Inhoudsclassificatie.** De vragenlijst levert PEGI 3 op. Vink
"bevat in-app-aankopen: ja" en "bevat advertenties: nee".

**Google Play → Handelaarsstatus (DSA).** Als bedrijf vul je je KvK-gegevens
in; als particulier kies je "geen handelaar" — maar dan mag je geen abonnement
verkopen.

**App Store → App Privacy.** Kies "Data Not Collected". Er is geen SDK in deze
app die iets verzamelt.

**App Store → Age Rating.** De vragenlijst levert 4+ op.

**App Store → Kids Category.** Overweeg hem *niet* in de Kids-categorie te
zetten. Die categorie is strenger (onder andere over externe links) en je app
bereikt ouders die zoeken op "arabisch leren" beter in **Onderwijs**. De app
voldoet aan de regels van beide; het is een marketingkeuze, geen technische.

---

## 5. Aan de reviewer

Apple leest dit veld echt. Zet er dit in:

> Darija Kids leert kinderen Marokkaans-Arabisch. Er is geen account en geen
> login nodig — de app opent direct in de eerste les.
>
> Om het abonnement te testen: tik onderin op "Leren", scrol naar unit 7 en tik
> op "Bekijken". Op het abonnementsscherm staat een ouderpoort: een
> vermenigvuldiging die je moet beantwoorden voordat de aankoop opent. Elk
> juist antwoord werkt.
>
> De abonnementen zijn app.darijakids.yearly (€ 59,88 per jaar) en
> app.darijakids.monthly (€ 6,99 per maand), beide met 3 dagen gratis.
> De voorwaarden en het privacybeleid staan in de app onder het
> abonnementsscherm, en online op [je URL].

---

## 6. De gesloten test bij Google (begin hier)

Nieuwe persoonlijke Play-accounts moeten dit doen vóór ze mogen publiceren:

1. Maak een **gesloten test** aan en upload je AAB.
2. Verzamel **12 testers** die het opt-in-adres gebruiken. Familie en vrienden
   mogen, maar ze moeten het écht installeren — Google meet dagelijkse
   activiteit.
3. Houd dat **14 dagen aaneengesloten** vol.
4. Pas daarna kun je "productie" aanvragen.

Zet dit als eerste in gang en doe de rest van deze lijst ondertussen.

---

## 7. Lanceren

De eerste week bepaalt meer dan de rest van het jaar. `store/social.md` heeft
de berichten in vijf talen; `store/press-kit.md` is wat je een journalist of
een nieuwsbrief stuurt.

Wat werkt, op volgorde:

1. **Je eigen netwerk eerst.** Familie-WhatsApp, vrienden met kinderen. Vraag
   niet om een recensie, vraag om een reactie: *"Wat zegt jouw familie voor
   brood?"*
2. **Facebook-groepen voor Marokkaanse ouders**, per stad en per land. Die
   groepen hebben duizenden leden en precies dit probleem.
3. **Scholen en moskeeën** die weekendlessen Arabisch geven. Die zoeken al
   jaren materiaal voor Darija en vinden het niet.
4. **Instagram en TikTok.** Het sterkste filmpje is niet de app, maar je eigen
   kind dat iets tegen oma zegt. De app is het bijschrift.
5. **Ramadan en Eid.** De twee momenten waarop dit soort berichten het verst
   reist. Plan er één omheen.

Vraag de eerste twintig mensen om een recensie in de winkel. Daaronder komt een
app niet in de aanbevelingen terecht, en het is het makkelijkste wat je vrienden
voor je kunnen doen.

---

## 8. Na de lancering

- Kijk eens per week in beide consoles naar crashes. Er is geen crashmelder in
  de app, dus dit is je enige zicht erop.
- Lees elke recensie. Bij een taalapp zijn de nuttigste recensies de mensen die
  zeggen dat hun familie een woord anders zegt — dat is gratis redactiewerk.
  `docs/INHOUD.md` legt uit hoe je een woord of een zin aanpast.
- Bij elke update: `versionCode` en `versionName` omhoog in
  `android/app/build.gradle`, en het buildnummer in Xcode.
- Houd de vijf talen gelijk. Een test faalt als er een vertaling ontbreekt, dus
  dat gaat vanzelf goed zolang je `npm test` draait.
