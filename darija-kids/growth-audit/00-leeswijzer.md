# Leeswijzer

> **Vooraf — 23 november 2026. De belangrijkste aanbeveling van deze audit is
> teruggedraaid. Lees dit voordat je verder leest.**
>
> **Er is geen gratis deel meer.** Geen gratis lessen en geen proefperiode.
> Downloaden is gratis, de cursus is een abonnement, en dat wordt gevraagd op
> het eerste scherm. Na het betalen gaat alles in één keer open — geen porties
> van acht lessen meer. Wie de app vóór 23 november had en lessen afrondde,
> houdt precies die afgeronde lessen open.
>
> **Dat draait de hoofdstelling van deze negen documenten om.** Ze bouwen
> allemaal op één aanbeveling: het gratis deel is te klein en de twee
> groeilussen staan erachter, dus verruim het. Die aanbeveling is in twee
> stappen uitgevoerd — op 12 november van vier naar acht lessen — en op 23
> november volledig teruggedraaid.
>
> **Waarom: het is gemeten, en de redenering eronder klopte niet.** Van 179
> eerste installaties namen vijf mensen een abonnement, en de vraag om geld
> kwam pas bij les negen — dagen nadat de app was weggelegd. Wat het gratis
> deel wél deed, was de app volledig bruikbaar maken voor wie nooit van plan
> was te betalen.
>
> De volledige onderbouwing staat in de code: de aantekening boven `magLeren`
> in `src/engine/store.ts`. Lees die eerst. `GRATIS_LESSEN`, `FREE_LESSONS`,
> `GRATIS_WOORDEN`, `GRATIS_LETTERS` en `gratisDeelOp` bestaan niet meer; in
> hun plaats staan `magLeren`, `lessonBehindPaywall`, `geleerd` en
> `nextLesson`.
>
> **Wat hieronder blijft staan, en waarom.** Dit is een momentopname van begin
> november, en de analyse erin is nog steeds de beste beschrijving van waar
> dit product staat. Er is dus niets herschreven en geen cijfer aangepast.
> Elke aanbeveling die door dit besluit is vervallen, draagt op zijn eigen
> plek een markering met 23 november erin; bij een verslag van 12 november
> staat die als alinea in dat verslag. Wat het besluit kost, staat
> in `09-executive-summary.md`.

Negen documenten, in de orde waarin ze zijn gevraagd. Wie één ding leest,
leest `09-executive-summary.md`.

Elke bewering draagt een label:

| Label | Betekenis |
| --- | --- |
| **BEWEZEN** | Af te lezen uit code in deze repository, uit een test die draait, of uit een cijfer dat in App Store Connect of de Play Console staat. Het bestand en de regel staan erbij. |
| **WAARSCHIJNLIJK** | Volgt uit bewezen feiten, maar de laatste stap is een gevolgtrekking. |
| **HYPOTHESE** | Een verklaring die past bij wat we zien en die nog niet getest is. Hoort een experiment bij. |
| **ONBEKEND** | We weten het niet, en dat is zelf een bevinding. Er staat bij waar het antwoord te halen is. |

Geen enkel conversiepercentage in deze documenten is verzonnen. Waar een
getal ontbreekt staat **ONBEKEND** en de meting die het zou opleveren.

Alles hieronder is Fase 1: diagnose. Er is geen app-code gewijzigd, geen
prijs aangepast en geen winkelinstelling aangeraakt.
