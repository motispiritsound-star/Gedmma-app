# Promotieafbeeldingen voor de aankopen

Gemaakt met `npm run iapbeeld`. Niet met de hand bijwerken.

Apple wees versie 1.0 (build 5) af omdat hier schermafdrukken stonden:

> Each promoted in-app purchase requires a unique promotional image.
> Promotional images should not be screenshots, and should not be confused
> with your app icon. [...] PNG or high-quality JPEG at 1024 x 1024 pixels.
> [...] avoid putting important details in the lower left corner [...] we
> recommend that you don't overlay text.

- `app.darijaforkids.yearly.png` — jaarabonnement — Fnek in een medaillon met twaalf sterren eromheen
- `app.darijaforkids.monthly.png` — maandabonnement — Fnek alleen, groot, op warm
- `app.darijaforkids.ebook.png` — e-boek — een open boek met Fnek die over de rand meekijkt

Geen tekst erin, in geen van de drie: Apple raadt het af, en een prijs of
een woord in het beeld klopt niet meer in een ander land of een andere taal.
Linksonder is leeg gehouden, want daar legt Apple de prijs over het beeld.

## Uploaden

App Store Connect → Monetization → In-App Purchases → de aankoop
→ Promotional Image. Eén beeld per aankoop, en de naam van het bestand is de
product-id, zodat er geen twee verwisseld kunnen worden.
