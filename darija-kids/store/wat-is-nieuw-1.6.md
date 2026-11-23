# Wat is er nieuw — versie 1.6

De tekst die per taal in Play Console en App Store Connect bij een release
gevraagd wordt. Play staat 500 tekens toe per taal, Apple 4000.
`winkelnieuws.test.ts` telt ze bij elke testronde na.

Bij Apple is dit **build 12**, bij Play **versiecode 11**. Eén nummer voor één
bundel code, net als bij 1.4 en 1.5.

Wat 1.6 is: het gratis deel is eruit. De cursus is één abonnement en gaat na
het betalen in één keer helemaal open. De onderbouwing staat in de aantekening
boven `magLeren` in `src/engine/store.ts`, en wat er in de consoles bij hoort
in `docs/STAND.md`.

**Waarom dit wél in de tekst staat en de proefperiode niet.**
Bij 1.5 stond hier dat een reparatie waar niemand iets van gemerkt had, buiten
de releasetekst blijft. Dat gold voor de drie gratis dagen die de winkel nooit
heeft gegeven: niemand is daar iets kwijt dat hij had.

Het gratis deel is van de andere soort. Wie de app al heeft, opent hem en ziet
dat er geen gratis lessen meer zijn. Wat een bestaande gebruiker zélf ontdekt,
schrijft hij op als beoordeling — op precies de winkelbladzijde waar de
campagne het verkeer naartoe stuurt. Staat het hieronder, dan is het een
mededeling.

De maat is dus niet "is het een reparatie of een nieuwe knop", maar: merkt
iemand die de app al heeft het, als het hier niet staat. Daarom staat het in
alle zes de talen vooraan, en staat in dezelfde alinea dat afgeronde lessen
open blijven. Die ene zin is het verschil tussen "ze hebben iets veranderd" en
"ze hebben iets van mij afgepakt", en hij staat er in gewone woorden: *die raak
je niet kwijt*.

**En er staat geen prijs in.**
Niet € 6,99, niet € 59,99, en ook niet de tijdelijke € 29,99 voor het eerste
jaar waar de campagne op hangt. Die horen in `store/lancering/mail.md`, in
`store/lancering/socials.md` en op de winkelbladzijde in `store/listing.nl.md`
en zijn vijf zusterbestanden — drie plekken die je op elke dag van het jaar
kunt bijwerken. Dit veld niet: het hoort bij een bundel code en blijft staan
tot de volgende release. Een actie die afloopt zou hier blijven hangen.


## nl-NL

De cursus is nu één abonnement: er zijn geen gratis lessen meer, en na het
betalen gaat alles in één keer open, niet in porties. Lessen die je al had
afgerond, blijven open. Die raak je niet kwijt.

## fr-FR

Le cours est désormais un seul abonnement : il n’y a plus de leçons gratuites,
et une fois payé, tout s’ouvre d’un coup, rien au compte-gouttes. Les leçons
que tu avais déjà terminées restent ouvertes. Tu ne les perds pas.

## de-DE

Der Kurs ist jetzt ein Abo: kostenlose Lektionen gibt es nicht mehr, und nach
dem Bezahlen steht alles auf einmal offen, nichts in Häppchen. Lektionen, die
du schon fertig hattest, bleiben offen. Die verlierst du nicht.

## es-ES

El curso es ahora una sola suscripción: ya no hay lecciones gratis, y después
de pagar todo se abre de una vez, nada a cuentagotas. Las lecciones que ya
habías terminado siguen abiertas. Esas no las pierdes.

## it-IT

Il corso è ora un unico abbonamento: non ci sono più lezioni gratuite e, dopo
il pagamento, si apre tutto in una volta sola, niente col contagocce. Le
lezioni che avevi già finito restano aperte. Quelle non le perdi.

## en-US

The course is now one subscription: there are no free lessons any more, and
once you pay everything opens in one go, nothing drip-fed. Lessons you had
already finished stay open. You do not lose those.
