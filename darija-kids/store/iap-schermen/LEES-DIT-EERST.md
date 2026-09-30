# Deze twee zijn géén promotieafbeeldingen

Het zijn schermafdrukken van 1290×2796 van het `/volledig`-scherm. Waar ze
ooit voor gemaakt zijn is niet meer na te gaan; wat er nu voor in de plaats
staat is duidelijk genoeg:

- **Review Screenshot** — het veld onder *Review Information* bij elke
  aankoop, waarmee je de beoordelaar laat zien waar de aankoop in de app zit.
  Dat hóórt een schermafdruk te zijn. Ze staan in `store/review-screenshot/`
  en komen uit `npm run reviewshot`. Die haalt zijn woorden en prijzen uit de
  app zelf, dus na een wijziging aan het koopscherm moet hij opnieuw.
- **Image (Optional)** — het vierkante veld van 1024×1024 boven *App Store
  Promotion*. Daar hoort géén schermafdruk en ook niet het app-icoon; dat
  laatste stond er, en daarop wees Apple versie 1.0 (build 5) af:

  > Each promoted in-app purchase requires a unique promotional image.
  > Promotional images should not be screenshots, and should not be confused
  > with your app icon. [...] PNG or high-quality JPEG at 1024 x 1024 pixels.

  Ze staan in `store/iap-beelden/` en komen uit `npm run iapbeeld`.

Schermafbeeldingen voor de winkelpagina van de app zelf — dus niet voor een
aankoop — staan in `store/screenshots/` en komen uit `npm run screenshots`.
