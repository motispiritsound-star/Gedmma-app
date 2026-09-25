# Richtlijn 2.3.8 — de ondertitel zei dat het een kinderapp was

Apple wees versie 1.0 (build 5) af op 25 september 2026. Niet om de app: om
één regel tekst in de winkel.

> We noticed the app subtitle to be displayed on the App Store includes the
> term "For the kids", which implies that the app is made specifically for
> children. However, this app was not submitted as a Kids category app.

Dat klopt, en het is een redelijk bezwaar. De Kinderen-categorie heeft eigen
regels — geen advertenties van derden, geen analytics, alles wat de app uit
gaat achter een ouderpoort — en Apple wil niet dat je de vruchten van die
categorie plukt zonder de regels te dragen. Dus: of je zegt dat het een
kinderapp is en je houdt je aan die regels, of je zegt het niet.

## Wat er is veranderd

De ondertitel, in alle zes de talen. Meer niet — geen nieuwe build, geen
Xcode, alleen tekst in App Store Connect.

| Taal | Was | Is |
|---|---|---|
| nl | Voor jong, en stiekem voor oud | Marokkaans-Arabisch leren |
| fr | Pour les petits, et pour vous | Apprendre l'arabe marocain |
| de | Marokkanisch für Kinder | Marokkanisch-Arabisch lernen |
| es | Para peques, y para ti también | Aprende árabe marroquí |
| it | Per i piccoli, e anche per te | Impara l'arabo marocchino |
| en | For the kids, quietly for you | Learn Moroccan Arabic |

Ze staan in `store/listing.<taal>.md`, en dat is het bestand dat telt.
`store/keywords.md` is een werkblad en liep achter; die tabel is meegegaan.

**De zoekwoorden blijven zoals ze zijn.** Apple noemt in zijn herstelstap
precies vier plekken: de naam, de ondertitel, het pictogram en de
schermafdrukken. Zoekwoorden ziet niemand, en "arabisch voor kinderen" is
precies waar een ouder op zoekt. De schermafdrukken zijn nagekeken — alle
zeven bijschriften gaan over het leerpad, het schrift, de woorden en de
spelletjes, en geen enkele over leeftijd.

## Het antwoord aan App Review

```
Hello,

Thank you for the review. We have updated the subtitle in all six
languages to remove any reference to children; the new English subtitle
is "Learn Moroccan Arabic".

Darijaforkids is the registered brand name under which the app, the
website darijaforkids.eu and our book series are published. The app is a
language course that a parent and child use together, which is why it was
submitted as an Education app rather than in the Kids category.

We have also checked the screenshots and the icon: neither contains any
term referring to children.

Kind regards,
Adil Bekkali
```

## Wat er nog boven de markt hangt

**De naam.** `Darijaforkids` draagt hetzelfde woord, en Apple noemt de naam in
dezelfde zin als de ondertitel. Deze ronde hebben ze hem niet aangestipt, maar
een volgende reviewer kan dat wel doen. Gebeurt dat, dan is hernoemen geen
optie — dat is het merk, het domein, de vier socials en de titelpagina van
tweeënnegentig boeken. Dan is de Kinderen-categorie het antwoord.

## En als het toch de Kinderen-categorie wordt

Dan is er werk in de app, en dat is meer dan een vinkje in App Store Connect.
Richtlijn 1.3 zegt dat een app in die categorie geen links naar buiten mag
hebben die een kind kan aantikken. Die heeft hij nu wél:

| Waar | Wat |
|---|---|
| `src/pages/Landing.tsx` | `FeedbackLink` — opent de mail-app |
| `src/pages/Words.tsx` | `WordFeedback`, bij **elk** woord in de lijst |
| `src/pages/Settings.tsx` | `FeedbackButton` |
| `src/pages/Privacy.tsx`, `Terms.tsx` | het contactadres als `mailto:` |

De ouderpoort (`src/ui/OuderPoort.tsx`, een vermenigvuldiging die een kind
niet zomaar oplost) staat er al, maar alleen vóór het abonnement en vóór het
mailformulier. Voor de Kinderen-categorie moet hij ook vóór deze links staan,
of moeten ze verhuizen naar het ouderscherm — dat laatste is waarschijnlijk
het betere: een kind schrijft die mail toch niet, een ouder wel.

De rest is al in orde, en dat is het meeste werk: geen advertenties, geen
analytics, geen trackers, geen cookies van derden, en er verlaten geen
persoonsgegevens het toestel. Dat staat niet alleen in de privacyverklaring,
het is ook zo — er zit geen enkele externe SDK in deze app.

Reken bij die route ook op een leeftijdsband (5 en jonger / 6–8 / 9–11; 6–8
past bij deze inhoud) en op een strengere beoordeling.
