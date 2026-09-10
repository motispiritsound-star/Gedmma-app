# Moet Noer in de App Store en Google Play?

Het korte antwoord: **nu niet.** Wat je vandaag hebt is een app die op elk
apparaat te installeren is, waar niemand tussen staat en waar je geen procent
van afdraagt. Wat een appwinkel je erbij geeft, is vindbaarheid — en die koop
je duur.

Dit bestand legt uit wat het precies kost, wat het oplevert, en hoe je het
alsnog doet als je het wilt.

## Wat je nu hebt

Noer is een **installeerbare webapp**. Een bezoeker opent `noer.nl`, tikt op
"Download Noer", en er komt een icoon op zijn beginscherm. Daarna:

- opent hij zonder adresbalk, met zijn eigen splash-scherm;
- werkt hij offline;
- werkt hij zelf bij, zonder dat iemand iets hoeft te downloaden;
- kost hij niemand een cent aan winkelcommissie.

Dat is geen tweederangs oplossing. Op Android is het exact hetzelfde
mechanisme dat achter een Play-installatie zit. Op iOS is het net zo goed een
app op het beginscherm; alleen kent Apple er geen winkelvermelding aan toe.

## Wat een appwinkel je zou kosten

### Google Play

| | |
|---|---|
| Ontwikkelaarsaccount | eenmalig $ 25 |
| Werk | een dag: de app in een *Trusted Web Activity* verpakken |
| Doorlooptijd | meestal een paar dagen tot een week |
| Commissie op abonnementen | 15% over het eerste miljoen per jaar |

Een Trusted Web Activity is geen namaak-app: het is precies jouw webapp,
volledig scherm, met je eigen icoon in de Play Store. De inhoud blijft op je
eigen server staan, dus een verbetering is meteen live — geen nieuwe
goedkeuring per wijziging.

### Apple App Store

| | |
|---|---|
| Ontwikkelaarsprogramma | $ 99 per jaar, elk jaar |
| Nodig | een Mac om te bouwen en in te dienen (of een betaalde bouwdienst) |
| Werk | enkele dagen: verpakken met Capacitor of een eigen schil |
| Doorlooptijd | dagen tot weken, afwijzingen meegerekend |
| Commissie op abonnementen | 15% in het kleinbedrijfprogramma, anders 30% |

En het risico dat je moet meewegen: Apple wijst apps af die "alleen een
website in een schil" zijn (richtlijn 4.2, minimale functionaliteit). Noer is
verdedigbaar — hij werkt offline, neemt geluid op, bewaart alles lokaal — maar
je moet dat verhaal wel voeren, en een afwijzing kost je twee weken.

Reken voor het eerste jaar op **± € 110 aan accounts**, plus je eigen tijd,
plus 15% van elke euro die binnenkomt. Bij € 7,99 per maand is dat € 1,20 per
abonnee per maand, elke maand.

### En de betaling zelf

Verkoop je digitale inhoud ín een app uit de winkel, dan schrijven Apple en
Google in principe hun eigen betaalsysteem voor. In de EU is dat door de
Digital Markets Act aan het schuiven: verwijzen naar je eigen betaalpagina
mag inmiddels, tegen een lagere vergoeding. Die regels veranderen per kwartaal.
**Kijk ze na op het moment dat je het echt gaat doen**, en reken niet op wat
hier staat — of op wat iemand je twee jaar geleden vertelde.

Dit is precies waarom de webversie eerst komt: daar houd je van € 7,99 na btw
en transactiekosten ongeveer € 6,35 over, en dat is de hele afdracht.

## Wanneer het wél de moeite waard is

Drie situaties:

1. **Ouders kunnen je niet vinden.** Als blijkt dat mensen "arabisch leren
   kinderen" in de Play Store intikken in plaats van in Google, dan sta je op
   de verkeerde plek. Dat kun je meten voordat je betaalt.
2. **Een school of moskee vraagt erom.** "Staat het in de store?" is voor
   sommige besturen een vertrouwensvraag, geen technische.
3. **Je wilt meldingen op iOS.** Pushmeldingen werken op iOS alleen in
   geïnstalleerde webapps, en dan beperkt. Wil je een dagelijks duwtje, dan is
   een echte app daar sterker.

Punt 3 is het enige echte functionele verschil. En bedenk: in de app zit met
opzet géén meldingssysteem. Dat was een keuze — "geen meldingen" staat op de
verkooppagina als belofte.

## Als je het doet: begin bij Android

Vijfentwintig dollar eenmalig, een dag werk, en je staat in de Play Store met
dezelfde app die je al hebt. Zo gaat dat:

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://noer.nl/app/manifest.webmanifest
bubblewrap build
```

Bubblewrap maakt een Android-project dat je webapp op volledig scherm draait.
Twee dingen die je daarbij moet regelen:

1. **De digitale handtekening koppelen.** Zonder dit toont Android alsnog een
   adresbalk. Bubblewrap geeft je een vingerafdruk; die zet je in een bestand
   `.well-known/assetlinks.json` op je domein. Een sjabloon staat in
   `landing/.well-known/assetlinks.json` — vul de vingerafdruk in en de
   statische bouwer neemt hem mee.
2. **Een schermafdruk en een korte omschrijving** voor de winkelvermelding.
   Die heb je al: `landing/marketing/` en `landing/beelden/`.

Voor iOS is de weg langer: Capacitor eromheen, een Mac, een certificaat, en
het gesprek met de beoordelaar over richtlijn 4.2. Doe dat pas als Android je
laat zien dat er vraag naar is.

## Wat je in de tussentijd tegen ouders zegt

Niet: "we zitten nog niet in de App Store." Wel wat er op `downloaden.html`
staat: één tik en het staat op je beginscherm, hij werkt offline, en er zit
geen winkel tussen die dertig procent meeneemt. Dat is geen excuus maar een
verschil in je voordeel — en het is het eerlijke verhaal.
