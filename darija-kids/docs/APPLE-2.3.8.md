# Richtlijn 2.3.8 — de naam zei dat het een kinderapp was

Apple wees versie 1.0 twee keer af op dezelfde richtlijn, en de tweede keer
raakte hij het punt waar het echt om ging.

| Datum | Waar Apple over viel |
| --- | --- |
| 25 september 2026 | De **ondertitel**: *For the kids, quietly for you* |
| 27 september 2026 | De **naam** zelf: `Darijaforkids` bevat *for kids* |

> We noticed the app name to be displayed on the App Store includes the term
> For kids, which implies that this app is made specifically for children.
> However, this app was not submitted as a Kids category app.

Het bezwaar is redelijk, en het is nu niet meer te ontlopen. De
Kinderen-categorie heeft eigen regels — geen advertenties van derden, geen
analytics, alles wat de app uit gaat achter een ouderpoort — en Apple wil niet
dat je de vruchten van die categorie plukt zonder de regels te dragen.

## Ronde 1 — de ondertitel

De ondertitel is in alle zes de talen vervangen; die tabel staat onderaan dit
bestand. Dezelfde build is opnieuw ingediend, zonder Xcode. Dat loste de
melding op maar niet de oorzaak: de naam draagt hetzelfde woord, en daar is
de tweede afwijzing op gekomen.

## Ronde 2 — het antwoord is de Kinderen-categorie

Apple biedt zelf twee uitwegen: de naam ontdoen van *kids*, of *Made for Kids*
aanzetten. Hernoemen is geen optie — dat is het merk, het domein
darijaforkids.eu, de vier socials en de titelpagina van tweeënnegentig boeken.
En het zou een halve waarheid zijn: de beschrijving zegt in elke taal dat de
app kinderen Darija leert, en bij Google Play staat hij al aangemeld als
*hoofdzakelijk voor kinderen* onder het Families-beleid. Bij Apple het
tegenovergestelde volhouden is een spagaat die elke volgende reviewer opnieuw
kan aantikken.

Dus: het ís een kinderapp, en dat wordt hij ook in App Store Connect.

### Wat er al goed was

Het duurste deel van die categorie was al af, en dat is niet vanzelf gegaan:

- geen advertenties, geen analytics, geen trackers, geen cookies van derden;
- geen enkele externe SDK — de hele afhankelijkhedenlijst is Capacitor, React
  en de aankoopplug-in van de winkels;
- er verlaten geen persoonsgegevens het toestel;
- de ouderpoort (`src/ui/OuderPoort.tsx`, een vermenigvuldiging die een kind
  niet zomaar oplost) bestond al, vóór het abonnement en vóór het
  mailformulier.

### Wat er in build 6 is veranderd

Richtlijn 1.3 zegt dat een kind zich niet met één tik de app uit mag werken.
Dat kon op acht plekken. Nu niet meer:

| Waar | Was | Is |
| --- | --- | --- |
| `src/ui/Feedback.tsx` | drie ingangen (voettekst, instellingen, ouderscherm, én onder elk woord) openden meteen de mail-app | alle drie achter `useMailPoort()` |
| `src/pages/Unlock.tsx` | het e-boek openen ging rechtstreeks de app uit | achter de poort |
| `src/pages/Unlock.tsx` | **het e-boek kópen stond achter niets** | achter de poort |
| `src/pages/Unlock.tsx` | opzeggen opende de winkel-app rechtstreeks | achter de poort |
| `src/ui/Operator.tsx` | mailadres en telefoonnummer waren aantikbare links | afgedrukt als tekst |
| `src/pages/Privacy.tsx`, `Terms.tsx` | het contactadres als `mailto:` | afgedrukt als tekst |

Dat e-boek kopen zonder poort was geen categoriekwestie maar een echt gat: een
kind kon met één tik geld uitgeven. Dat is nu dicht.

De poort zegt bovendien niet meer overal hetzelfde. Hij kende één zin, over
abonneren, en die stond ook boven het mailformulier. Een ouder die drie keer
dezelfde zin ziet leest eroverheen, en dan bewaakt de poort niets meer. Nu zijn
het er drie — geld, e-mailadres, de app uit — in alle zes de talen.

`src/ui/kinderslot.test.ts` houdt het zo. Die test kent élke uitgang die de app
mag hebben, met de reden erbij. Komt er een nieuwe bij, dan valt hij om.

### Wat jij in App Store Connect doet

1. **Rating → "Made for Kids" aanzetten**, met leeftijdsband **6–8**. Dat is
   letterlijk wat Apple in *Next Steps* vraagt.
2. De naam `Darijaforkids` blijft staan. De ondertitels ook — in de
   Kinderen-categorie mag *voor kinderen* weer, maar er is geen reden om een
   goedgekeurde regel opnieuw ter discussie te stellen.
3. Build 6 uploaden (zie hieronder) en indienen.

### Wat jij op de Mac doet

Build 5 kan niet opnieuw: de app zelf is veranderd.

```bash
cd ~/Gedmma-app/darija-kids
git pull
npm install
npm run ios -- --build 6
npx cap open ios
```

Dan in Xcode **Product → Archive** en **Distribute App**. De rest staat in
`docs/MAC.md`.

### Het antwoord aan App Review

```
Hello,

Thank you for the review.

Darijaforkids is a language course for children, and the name is our
registered brand: it is also our website darijaforkids.eu and the title of
our printed book series. Rather than rename the app, we have made it meet
the guideline.

We have selected "Made for Kids" in the Rating section with an age band of
6-8, and build 6 brings the app in line with Guideline 1.3:

- Every action that leaves the app is now behind a parental gate: the
  feedback e-mail (all three entry points), opening the purchased e-book,
  and managing the subscription.
- The trader details required by the Digital Services Act, our e-mail
  address and telephone number, are printed as text rather than as tappable
  links.
- The subscription purchase was already behind the parental gate; the
  e-book purchase is now behind it as well.
- The app contains no third-party SDKs: no advertising, no analytics, no
  trackers, and no personal data leaves the device.

Kind regards,
Adil Bekkali
```

## De ondertitels, uit ronde 1

| Taal | Was | Is |
|---|---|---|
| nl | Voor jong, en stiekem voor oud | Marokkaans-Arabisch leren |
| fr | Pour les petits, et pour vous | Apprendre l'arabe marocain |
| de | Marokkanisch für Kinder | Marokkanisch-Arabisch lernen |
| es | Para peques, y para ti también | Aprende árabe marroquí |
| it | Per i piccoli, e anche per te | Impara l'arabo marocchino |
| en | For the kids, quietly for you | Learn Moroccan Arabic |

Ze staan in `store/listing.<taal>.md`, en dat is het bestand dat telt.

**De zoekwoorden blijven zoals ze zijn.** Apple noemt in zijn herstelstap
precies vier plekken: de naam, de ondertitel, het pictogram en de
schermafdrukken. De schermafdrukken zijn nagekeken — alle zeven bijschriften
gaan over het leerpad, het schrift, de woorden en de spelletjes, en geen
enkele over leeftijd.

## Wat dit kost, en wat het oplevert

Een nieuwe beoordeling in plaats van alleen andere tekst, en kinderapps worden
strenger bekeken. Reken op een paar dagen.

Daar staat tegenover dat de naam blijft, dat Apple en Google voortaan hetzelfde
zeggen over wie deze app gebruikt, en dat richtlijn 2.3.8 hierna niet meer kan
terugkomen — want vanaf nu klopt wat er staat.
