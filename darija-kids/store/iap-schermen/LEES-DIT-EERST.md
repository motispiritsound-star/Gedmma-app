# Deze twee zijn géén promotieafbeeldingen

Het zijn schermafdrukken van 1290×2796. Ze zijn in App Store Connect bij
**Promotional Image** beland, en dáárop wees Apple versie 1.0 (build 5) af:

> Each promoted in-app purchase requires a unique promotional image.
> Promotional images should not be screenshots, and should not be confused
> with your app icon. [...] PNG or high-quality JPEG at 1024 x 1024 pixels.

Twee dingen mis tegelijk: het is een schermafdruk, en het is niet vierkant.

De echte promotieafbeeldingen staan in **`store/iap-beelden/`** en worden
gemaakt met `npm run iapbeeld`. Eén per aankoop, 1024×1024, getekend.

Schermafbeeldingen voor de winkel zelf — dus voor de app, niet voor een
aankoop — staan in `store/screenshots/` en komen uit `npm run screenshots`.
