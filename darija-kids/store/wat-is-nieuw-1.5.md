# Wat is er nieuw — versie 1.5

De tekst die per taal in Play Console en App Store Connect bij een release
gevraagd wordt. Play staat 500 tekens toe per taal, Apple 4000.
`winkelnieuws.test.ts` telt ze bij elke testronde na.

Bij Apple is dit build 11, bij Play versiecode 10. Eén nummer voor één bundel
code, net als bij 1.4.

Wat 1.5 is: de eerste release die niet over het leren zelf gaat maar over wat
eromheen stond. Twee reparaties die je ziet, vier knoppen die er niet waren, en
drie plekken waar het scherm iets beloofde wat de winkel niet waarmaakte.

Daar is op 23 november iets bij gekomen dat zwaarder weegt dan die drie bij
elkaar, en het is niet van dezelfde soort: het gratis deel is eruit. De cursus
is één abonnement en gaat na het betalen in één keer helemaal open. De
onderbouwing staat in de aantekening boven `magLeren` in `src/engine/store.ts`,
en wat er in de consoles bij hoort in `docs/STAND.md`.

**Wat er wél in staat en wat niet — het onderscheid loopt niet waar het liep.**
Hier stond dat de derde groep met opzet buiten de tekst blijft, en voor die
groep geldt dat nog steeds. "Wij beloofden je drie gratis dagen die je niet
kreeg" is waar, maar het is geen regel waarmee je een update aankondigt — het
is een reparatie die niemand had horen te merken en die je in stilte hoort te
doen. En niemand is daar iets kwijt dat hij had: die drie dagen heeft de winkel
nooit gegeven.

Het gratis deel is van de andere soort, en daar houdt die redenering op. Dit is
geen stille reparatie: wie de app al heeft, opent hem en ziet dat er geen
gratis lessen meer zijn. Wat een bestaande gebruiker zelf ontdekt, schrijft hij
op als beoordeling — op precies de winkelbladzijde waar de campagne het verkeer
naartoe stuurt. Staat het hieronder, dan is het een mededeling.

De maat is dus niet "is het een reparatie of een nieuwe knop", maar: merkt
iemand die de app al heeft het, als het hier niet staat. De downloadknop die
niets deed, de poort die openbleef, de wisknop zonder poort, de drie dagen die
er nooit waren — nee. Het gratis deel — ja. Daarom staat het in alle zes de
talen vooraan, en staat er in dezelfde alinea bij dat afgeronde lessen open
blijven. Die ene zin is het verschil tussen "ze hebben iets veranderd" en "ze
hebben iets van mij afgepakt", en hij staat er in gewone woorden: *die raak je
niet kwijt*.

En de toon van 1.4 blijft: dit is geen opsomming van wijzigingen, het is wat er
anders is als je de app opent.

**Eén getal stond fout.** Hier stond "25, 50, 100 woorden" bij de deelkaart, in
alle zes de talen. `MIJLPALEN` in `src/engine/delen.ts` is
`[20, 50, 100, 200, 304]`, dus de eerste mijlpaal is twintig — vijfentwintig
stond daar tot 12 november, en de aantekening boven `MIJLPALEN` legt uit waarom
het verlaagd is. Het staat nu in alle zes de talen op 20. Alleen de eerste drie
worden genoemd, en dat is een keuze en geen ruimtegebrek: ", 200, 304" erbij
kost tien tekens en blijft in alle zes de talen onder de 500. Maar 304 is de
hele woordenlijst van de cursus, en een mijlpaal die pas aan het eind van het
pad komt zegt niets tegen iemand die vandaag de app opent.

**En er staat geen prijs in.** Niet € 6,99, niet € 59,99, en ook niet de
tijdelijke € 29,99 voor het eerste jaar waar de campagne op hangt. Die hoort
in `store/lancering/mail.md` en `store/lancering/socials.md`, en op de
winkelbladzijde in `store/listing.nl.md` en zijn vijf zusterbestanden — drie
plekken die je op elke dag van het jaar kunt bijwerken. Dit veld niet: de
notities blijven aan deze release hangen zolang build 11 en versiecode 10 de
laatste zijn, en de einddatum van de actie is nog niet gekozen. Een prijs die
hier staat als de actie voorbij is, is een prijsbelofte die de winkel niet
rekent, en dat is bij Apple richtlijn 2.3.1 — woordelijk ook geldig "whether
within or outside of the App Store". Daarom staat `[EINDDATUM]` hier ook niet:
er is geen zin die hem nodig heeft.

**Twee kleine dingen uit 1.5 zijn weggevallen**, en dat is de 500 tekens van
Play. Het seintje per dag waarvan je de tijd zelf kiest, en het alfabetscherm
dat weer goed telt — 28 letters, niet 31. Ze zitten wel in de release, en ze
staan ook beschreven: de dagelijkse wekker in `docs/STAND.md` en in de kop van
`src/engine/herinnering.ts`, de 28 letters in `store/press-kit.md` en in
`src/content/content.test.ts`. Ze staan alleen niet in dit veld. Wat hun plaats
heeft ingenomen is de alinea die een boze beoordeling moet voorkomen, en die
weegt zwaarder dan allebei. Wie er later iets bij wil zetten begint met het
seintje, en deze regel zegt of het dan nog past:

```powershell
if (-not $p) { $p = (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }; if ($p) { npm --prefix $p test -- src/site/winkelnieuws.test.ts } else { "darija-kids niet gevonden onder $HOME" }
```

## nl-NL

De cursus is nu één abonnement: er zijn geen gratis lessen meer, en na het
betalen gaat alles in één keer open, niet in porties. Lessen die je al had
afgerond, blijven open. Die raak je niet kwijt.

Je kunt nu laten zien wat je kent. Haal je een mijlpaal — 20, 50, 100
woorden — dan maakt de app er een kaart van die je in één tik deelt.

Heb je een code van een school of een actie? Die wissel je nu in de app zelf
in, bij het abonnement.

## fr-FR

Le cours est désormais un seul abonnement : il n’y a plus de leçons gratuites,
et une fois payé, tout s’ouvre d’un coup, rien au compte-gouttes. Les leçons
que tu avais déjà terminées restent ouvertes. Tu ne les perds pas.

Tu peux maintenant montrer ce que tu connais. À chaque palier — 20, 50, 100
mots — l’application en fait une carte que tu partages d’un seul geste.

Tu as un code d’une école ou d’une action ? Tu l’utilises dans l’application
même, au niveau de l’abonnement.

## de-DE

Der Kurs ist jetzt ein Abo: kostenlose Lektionen gibt es nicht mehr, und nach
dem Bezahlen steht alles auf einmal offen, nichts in Häppchen. Lektionen, die
du schon fertig hattest, bleiben offen. Die verlierst du nicht.

Du kannst jetzt zeigen, was du kannst. Erreichst du eine Stufe — 20, 50, 100
Wörter —, macht die App daraus eine Karte, die du mit einem Tippen teilst.

Du hast einen Code von einer Schule oder einer Aktion? Den löst du in der App
selbst ein, beim Abo.

## es-ES

El curso es ahora una sola suscripción: ya no hay lecciones gratis, y después
de pagar todo se abre de una vez, nada a cuentagotas. Las lecciones que ya
habías terminado siguen abiertas. Esas no las pierdes.

Ahora puedes enseñar lo que sabes. Cuando llegas a una meta — 20, 50, 100
palabras —, la aplicación crea una tarjeta que compartes con un solo toque.

¿Tienes un código de una escuela o de una campaña? Ahora lo canjeas en la
propia aplicación, en la suscripción.

## it-IT

Il corso è ora un unico abbonamento: non ci sono più lezioni gratuite e, dopo
il pagamento, si apre tutto in una volta sola, niente col contagocce. Le
lezioni che avevi già finito restano aperte. Quelle non le perdi.

Ora puoi mostrare quello che sai. Quando raggiungi un traguardo — 20, 50, 100
parole —, l’app ne fa una scheda che condividi con un solo tocco.

Hai un codice di una scuola o di un’iniziativa? Adesso lo riscatti nell’app
stessa, nell’abbonamento.

## en-US

The course is now one subscription: there are no free lessons any more, and
once you pay everything opens in one go, nothing drip-fed. Lessons you had
already finished stay open. You do not lose those.

You can now show what you know. Reach a milestone — 20, 50, 100 words — and
the app turns it into a card you share with one tap.

Got a code from a school or a campaign? You can now redeem it inside the app
itself, at the subscription screen.
