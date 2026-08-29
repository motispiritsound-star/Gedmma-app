# PRODUCT_DECISIONS

**De keuzes die deze MVP vormgaven, met de afwegingen erbij**
**The choices that shaped this MVP, with the trade-offs**

Elke beslissing hieronder had een redelijk alternatief. Waar dat zo is, staat
het erbij — inclusief wat we ervoor hebben opgegeven.

---

## 1. FocusFamily staat naast het bestaande project in deze repository

**Beslissing.** De repository bevatte al een niet-verwant project
(`webscan-nl`). FocusFamily leeft daarom volledig in `focusfamily/`, met een
eigen `package.json`, lockfile en tooling.

**Waarom.** Omkeerbaar. Niets aan het bestaande project is aangeraakt; het
verwijderen van één map maakt de wijziging ongedaan.

**Prijs.** Twee lockfiles in de repository. Next.js waarschuwt daarover, wat we
opgelost hebben met `outputFileTracingRoot` in `next.config.mjs`.

---

## 2. Alle regels in één framework-vrij pakket

**Beslissing.** `packages/domain` bevat elke productieregel en importeert
niets behalve Zod.

**Waarom.** De API, de webapp en de mobiele app moeten hetzelfde antwoord
geven. Eén implementatie is de enige manier waarop dat blijft kloppen. En het
maakt de regels testbaar zonder een server: 120 tests draaien in ongeveer
honderd milliseconden.

**Alternatief.** De regels in de API zetten en de clients laten vragen. Dat
werkt totdat de mobiele app offline is en zelf moet beslissen of een moment
telt — precies het geval waar dit product op gebouwd is.

---

## 3. De adapter-interface is de privacygrens, niet een beleidsregel

**Beslissing.** `ScreenTimeAdapter` heeft geen methode die een bericht, URL,
toetsaanslag, schermafbeelding of coördinaat kan teruggeven.

**Waarom.** Een beleidsregel in een document wordt ooit vergeten. Een
ontbrekende methode moet iemand actief toevoegen, in een bestand dat één
duidelijk doel heeft — en dat is een reviewmoment.

**Bewijs.** Een test loopt de methodenamen van elke adapter langs en faalt op
`message`, `browsing`, `keystroke`, `location`, `screenshot`. Een tweede test
vraagt de API om `/messages/:id` en verwacht `404`.

---

## 4. De weigerlijst is openbaar en machineleesbaar

**Beslissing.** `GET /capabilities` geeft zonder inloggen de volledige lijst
van dingen die dit product niet doet.

**Waarom.** "Vertrouw ons" is geen privacybelofte. Een tiener die wil weten of
haar ouders kunnen meelezen, kan het antwoord zelf ophalen.

**Alternatief.** Alleen op de privacypagina zetten. Dat is niet controleerbaar
door een ander systeem, en niet door iemand die de website niet gelooft.

---

## 5. Een afspraak gaat niet in zonder regel voor de volwassenen

**Beslissing.** `validateAgreement()` markeert `adults_not_included`, de API
weigert `activate` met `400`, en de knop is uitgeschakeld.

**Waarom.** Dit is het verschil tussen dit product en een toezichtapp. Als het
alleen een suggestie was, zou het bij de eerste gespannen avond sneuvelen.

**Prijs.** Sommige gezinnen wíllen alleen iets voor de kinderen afspreken, en
die kunnen we niet bedienen. Dat is een aanvaarde beperking, geen bug. Het
concept mag wel bestaan — je kunt alleen niet op "laten ingaan" drukken.

**Alternatief overwogen.** Een waarschuwing tonen en toch laten ingaan. Dat
maakt van de regel een suggestie, en van het product een gewone parental-control-app
met vriendelijkere kleuren.

---

## 6. Kind-instemming vanaf elf jaar

**Beslissing.** Vanaf de band 11–13 is de toestemming van een ouder
noodzakelijk maar niet voldoende: het kind moet zelf ook ja zeggen voordat er
iets gemeten wordt.

**Waarom.** Elf is de grens waarop de meeste kinderen begrijpen wat "de
telefoon meldt dagtotalen" betekent, en het sluit aan bij hoe de AVG in
Nederland naar kinderen kijkt. Onder de elf krijgt het kind wel het uitlegscherm
te zien, in eigen woorden.

**Prijs.** Een ouder kan een meting niet aanzetten zonder gesprek. Dat is het
product, niet een omweg eromheen.

**Alternatief overwogen.** De grens op dertien leggen, zoals veel Amerikaanse
diensten. Elf sluit beter aan bij het moment waarop kinderen in Nederland een
eigen telefoon krijgen.

---

## 7. Nul `os_verified`-rijen in de demo

**Beslissing.** De seed bevat zelfgerapporteerde gegevens, door de app
waargenomen focusmomenten en duidelijk gelabelde gesimuleerde gegevens — en
geen enkele rij die zich voordoet als een OS-meting.

**Waarom.** Er is geen entitlement, dus er is geen meting. Een rij toevoegen
"omdat het scherm er dan beter uitziet" is precies het gedrag dat het product
zegt af te wijzen.

**Bonus.** Het dwingt de belangrijkste lege staat af: het weekoverzicht moet
kloppen wanneer de telefoon níéts heeft gemeld, en het zegt dat ook —
*"Geen telefoon heeft iets gemeld."*

---

## 8. Deterministische regels, geen model

**Beslissing.** `recommendOne()` is een geordende reeks if-statements.

**Waarom.** Een gezin moet kunnen zien waarom het een voorstel krijgt. Een
deterministische regel kan haar eigen bewijs tonen; een model kan dat niet op
een manier die een ouder aan tafel kan navertellen.

**Wat het kost.** Minder nuance. Zes voorstellen, geen persoonlijke toon. Voor
een MVP is dat de juiste ruil.

**De AI-deur staat op een kier.** `AiAdvisor` bestaat als interface, de
gegevensgrens (`ALLOWED_FACT_KEYS`) staat vast, `prepareAiRequest()` filtert
alles daarbuiten weg en `validateAiSuggestion()` weigert klinische taal. De
verzonden implementatie is `DisabledAiAdvisor`, en aanzetten vraagt bovendien
om een `ai.assistant`-toestemming per gezin.

---

## 9. Momentum in plaats van reeksen

**Beslissing.** Geen streak. `momentum()` geeft de huidige week, de beste week
en `lostAnything: false`.

**Waarom.** Reeksen werken via verliesaversie. Dat is effectief, en dat is het
probleem: het is een druktechniek, ingezet op kinderen, in een app die zegt
tegen druktechnieken te zijn.

**Prijs.** Minder dagelijkse betrokkenheid. Dat accepteren we.

---

## 10. Zestig procent telt als afgemaakt

**Beslissing.** `COMPLETION_RATIO = 0.6`.

**Waarom.** Een gezin dat om acht over zes aan tafel gaat en om kwart voor zeven
opstaat, heeft samen gegeten. Honderd procent eisen zou dat een mislukking
noemen, en er is geen woord in dit product dat "mislukking" mag zeggen.

**Prijs.** Het getal is arbitrair. Het staat als één constante op één plek, en
kan met bewijs worden bijgesteld.

---

## 11. Herkomstlabels met een zekerheidsplafond

**Beslissing.** Vier herkomsten, elk met een maximum aan zekerheid dat we
mogen claimen (`MAX_CONFIDENCE_BY_SOURCE`), afgedwongen door
`clampConfidence()`.

**Waarom.** Zonder plafond zou een zelfgerapporteerd getal via een enthousiaste
UI alsnog als "gemeten" op het scherm belanden. Het plafond maakt dat
onmogelijk in plaats van onwaarschijnlijk.

---

## 12. Een echte database in de tests

**Beslissing.** De API-tests praten met PostgreSQL, niet met een nepobject.

**Waarom.** De interessante fouten zitten in transacties, unieke sleutels en
cascades bij verwijderen. Een nepobject bevestigt vooral wat je al dacht.

**Prijs.** Er moet een database draaien om te testen. De testset legt zelf de
migraties aan en geeft een duidelijke foutmelding als hij er niet bij kan.

---

## 13. Server Actions in plaats van een client-side API-client

**Beslissing.** De webapp haalt data server-side op en muteert via Server
Actions; de browser praat niet rechtstreeks met de API.

**Waarom.** De sessiecookie blijft httpOnly en verlaat de server nooit richting
JavaScript. Er is één origin, dus geen CORS met credentials en een veel kleiner
aanvalsoppervlak. En de formulieren werken zonder JavaScript.

**Uitzondering.** De focustimer moet zijn wachtrij kunnen wegschrijven vanuit
de browser. Die gaat via een same-origin route handler die het verzoek doorzet
— dus nog steeds één origin.

---

## 14. Handgeschreven CSS in plaats van een utility-framework

**Beslissing.** Eén `globals.css` met tokens, geen Tailwind.

**Waarom.** Contrast, focusringen en `prefers-reduced-motion` staan zo op één
leesbare plek. Voor een product dat WCAG 2.2 AA serieus neemt is dat waardevoller
dan de snelheid van utility-classes. Het scheelt ook een buildstap.

**Prijs.** Meer regels CSS, en geen automatische opruiming van ongebruikte
stijlen.

---

## 15. De mobiele app is dun

**Beslissing.** Expo met vier schermen — vandaag, afspraken, focus, check-in,
plus het transparantiescherm — en geen eigen regels.

**Waarom.** De grote focustimer is het scherm waarvoor een telefoon nodig is;
de rest is op het web prettiger. Bovendien kan er zonder entitlements toch geen
OS-meting plaatsvinden, dus een uitgebreidere app zou vooral leegte tonen.

**Wat er wel staat.** De volledige adapterketen, inclusief het eerlijke
foutpad, plus componenttests die bewijzen dat de offline timer klopt en dat de
teksten warm zijn.

---

## 16. Eén gezin per account

**Beslissing.** Een gebruiker heeft precies één `Membership`.

**Waarom.** Samengestelde gezinnen met twee huishoudens hebben een echt en
ingewikkeld model nodig: wiens afspraak geldt op woensdag, wie ziet wat, hoe
werkt toestemming als er vier volwassenen zijn. Half doen is erger dan niet
doen.

**Wat er nu gebeurt.** `POST /families` weigert met `family.already_member` als
je al ergens bij hoort.

---

## 17. Gratis is gratis, premium is diepte

**Beslissing.** `NEVER_GATED` legt vast dat afspraken lezen, focusmomenten,
check-ins, exporteren, verwijderen, toestemming intrekken en de bibliotheek
nooit achter een betaalmuur komen.

**Waarom.** Als veiligheid of privacy geld kost, is het geen veiligheid maar een
verkoopargument. Premium koopt meerdere afspraken, langere geschiedenis,
begeleide programma's en extra activiteitenpakketten.

**Een test bewaakt het.** Geen enkele nooit-gate-mogelijkheid mag in een betaald
plan voorkomen.

---

## 18. Stripe in testmodus, of helemaal niet

**Beslissing.** `BILLING_PROVIDER=stripe_test` eist `STRIPE_SECRET_KEY`,
anders start de API niet. Zonder sleutel draait `MockBillingProvider`, die de
afrekenpagina teruggeeft met `mock_session=` in de URL en overal "testmodus"
toont.

**Waarom.** Een nagemaakte betaling die zich voordoet als een echte is de
makkelijkste manier om per ongeluk een demo te tonen die niet klopt.

---

## 19. Verwijderen met zeven dagen bedenktijd

**Beslissing.** `DELETION_GRACE_DAYS = 7`, annuleerbaar tot het moment zelf,
daarna een echte cascade-verwijdering.

**Waarom.** Verwijderen wordt vaak in een emotioneel moment aangevraagd. Een
week is genoeg om terug te komen en kort genoeg om het geen "gedeactiveerd" te
maken.

**Wat er nog ontbreekt.** Een geplande taak die het uitvoert. De route bestaat
zodat de demo de hele cyclus kan tonen.

---

## 20. Nederlands eerst, Engels ernaast

**Beslissing.** Beide talen zijn eersterangs. 190 sleutels, in beide talen, met
een typedefinitie die afdwingt dat er niets ontbreekt.

**Waarom.** Het product is voor Nederlandse gezinnen, en de zorgvuldigste
formuleringen in dit product — over toestemming, over herkomst, over pauzeren —
zijn in het Nederlands geschreven en daarna vertaald, niet andersom.

**Bewijs.** Een test controleert dat de sleutelsets identiek zijn, dat geen
string leeg is, en dat beide catalogi de blokkeerlijsten doorstaan.

---

## Wat er als volgende zou moeten gebeuren / What should happen next

1. **De native iOS-module**, met het entitlement-verzoek erbij. Zonder dat blijft
   `os_verified` een lege categorie.
2. **Een geplande taak voor verwijderingen**, zodat de belofte zichzelf nakomt.
3. **Push-bezorging.** De beslissing (`shouldDeliver`) is af en getest; er is
   geen APNs/FCM-koppeling.
4. **Uitnodigingen per e-mail** in plaats van een token in de respons.
5. **Een echte accessibility-audit** met schermlezers op beide platforms. De
   basis staat, maar geautomatiseerde controles vervangen geen gebruiker.
6. **Onderzoek naar het zestig-procent-getal** en naar de volgorde van de
   aanbevelingen. Nu zijn het beredeneerde keuzes, geen gemeten keuzes.
7. **Samengestelde gezinnen**, als er vraag naar is en er tijd is om het goed te
   doen.
