# De namen en beschrijvingen van de abonnementen

Wat er nu in App Store Connect staat, is bij de meeste talen de appnaam met
een Nederlandse zin eronder. Dat is de vermelding die een koper ziet op het
betaalvenster van Apple — en buiten Nederland is dat dus de verkeerde taal.

Deze tekst is te plakken en blijft binnen de grenzen van Apple:
**30 tekens** voor de naam, **45 tekens** voor de beschrijving. Die grenzen
zijn hard; er wordt niet afgekapt, het veld weigert. Alles hieronder is
nageteld (`src/engine/billing.test.ts` telt ze bij elke testronde).

## Wanneer

**Niet nu.** Zolang een versie *Waiting for Review* of *In Review* staat, zijn
de abonnementen vergrendeld en is het scherm alleen-lezen. Dat is geen fout —
Apple beoordeelt de abonnementen mee met de versie. Zodra 1.0 is goedgekeurd
of afgewezen, gaat het slot eraf.

## Wat waar

`app.darijaforkids.yearly` — € 59,99 per jaar, drie dagen gratis.
**Het e-boek zit erbij**; dat regelt de app zelf (`src/engine/billing.ts`),
er is geen apart bundelproduct. Dat hoort dus in de beschrijving te staan,
want het is het verschil met per maand.

| Taal | Naam (≤30) | Beschrijving (≤45) |
|---|---|---|
| Nederlands | Een jaar | Alle 17 units, 304 woorden en het e-boek. |
| English | One year | All 17 units, 304 words and the e-book. |
| Français | Un an | 17 unités, 304 mots et le livre numérique. |
| Deutsch | Ein Jahr | 17 Einheiten, 304 Wörter und das E-Book. |
| Español | Un año | 17 unidades, 304 palabras y el libro digital. |
| Italiano | Un anno | 17 unità, 304 parole e l'ebook. |

`app.darijaforkids.monthly` — € 6,99 per maand, drie dagen gratis. Geen
e-boek; dat is een los product van € 14,99.

| Taal | Naam (≤30) | Beschrijving (≤45) |
|---|---|---|
| Nederlands | Per maand | Alle 17 units, 304 woorden, 100 zinnen. |
| English | Monthly | All 17 units, 304 words, 100 sentences. |
| Français | Par mois | 17 unités, 304 mots, 100 phrases. |
| Deutsch | Monatlich | 17 Einheiten, 304 Wörter, 100 Sätze. |
| Español | Al mes | 17 unidades, 304 palabras, 100 frases. |
| Italiano | Al mese | 17 unità, 304 parole, 100 frasi. |

## Als je maar één taal doet

Doe dan **English**. Dat is de vermelding voor iedereen buiten Nederland, in
alle 174 andere landen. De andere vier zijn winst, geen voorwaarde.

## Wat je níét verandert

De **product-ids** (`app.darijaforkids.yearly`, `app.darijaforkids.monthly`,
`app.darijaforkids.ebook`) en de **abonnementsgroep**. De code zoekt ze op die
namen op; een id dat verschuift is een app die zijn eigen abonnement niet meer
herkent. Zie `src/engine/billing.ts`.

De **prijzen** ook niet — Nederland staat goed op € 59,99 en € 6,99. Wat daar
nog wél moet gebeuren staat in `docs/STAND.md` onder *Wat alleen jij kunt
doen*, punt 1: de prijsbasis van de Verenigde Staten naar Nederland.
