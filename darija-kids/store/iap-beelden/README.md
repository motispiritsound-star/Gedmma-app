# Promotieafbeeldingen voor de aankopen

Gemaakt met `npm run iapbeeld`. Niet met de hand bijwerken.

Apple wees versie 1.0 (build 5) af omdat bij alle drie de aankopen het
app-icoon in dit veld stond. Het heet in App Store Connect "Image
(Optional)" en zit boven *App Store Promotion*.

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

Het veld heet **Image (Optional)** en zit boven *App Store Promotion*. Eén
beeld per aankoop; de bestandsnaam is de product-id, zodat er geen twee
verwisseld kunnen worden.

De drie staan niet bij elkaar in App Store Connect:

| Aankoop | Waar |
|---|---|
| `app.darijaforkids.yearly` | Monetization → **Subscriptions** → de groep |
| `app.darijaforkids.monthly` | Monetization → **Subscriptions** → de groep |
| `app.darijaforkids.ebook` | Monetization → **In-App Purchases** |

Onder *In-App Purchases* staat alleen het e-boek: dat is een Non-Consumable.
Een automatisch verlengend abonnement staat onder *Subscriptions*, en wie
alleen naar het eerste scherm kijkt denkt dat er twee aankopen zoek zijn.

Kijk daar ook of er **Offers** of **Win-Back Offers** zijn. Apple noemt die
in de afwijzing apart, en ze hebben een eigen beeldveld.
