# Desktoparchitectuur (fase 5)

## Waarom een desktopapp

Voor een deel van de doelgroep — accountantskantoren en administratiekantoren —
is een desktopapp prettiger: bestanden slepen vanuit de verkenner, meerdere
vensters naast elkaar, en een snelkoppeling die niet in een tabblad verdwijnt.

Het is uitdrukkelijk een *aanvulling*, geen aparte productlijn. De desktopapp
toont dezelfde webinterface en praat met dezelfde API.

## Techniek

| Onderdeel | Keuze | Reden |
| --- | --- | --- |
| Schil | Tauri | Kleine installatie, gebruikt de systeemwebview, geen tweede browser meesturen |
| Inhoud | Dezelfde bundel als `apps/web` | Eén codebase, dus geen gedrag dat uit elkaar loopt |
| Updates | Tauri updater met ondertekende releases | Automatisch bijwerken zonder handmatig downloaden |
| Tokens | Systeemsleutelbos (Keychain op macOS, Credential Manager op Windows) | Nooit in een bestand naast de app |

Waarom Tauri en niet Electron: een Electron-app stuurt een volledige
Chromium mee (ruim 100 MB per installatie) en heeft een eigen updatecyclus voor
browserbeveiliging. Tauri gebruikt de webview van het systeem, die door het
besturingssysteem wordt bijgewerkt.

## Wat de desktopapp toevoegt

| Functie | Toelichting |
| --- | --- |
| Slepen en neerzetten | Bonnen en bankbestanden vanuit de verkenner naar het venster |
| Bestandskiezer | Meerdere bestanden tegelijk, met voortgang per bestand |
| Meerdere vensters | Bijvoorbeeld een administratie naast een rapport |
| Snelkoppelingen | Nieuwe factuur, bon toevoegen, zoeken |
| Offline voorbereiden | Documenten klaarzetten die worden verzonden zodra er verbinding is |

## Beveiliging

* **Geen financiële database op de schijf.** De app is een schil om de
  webinterface; gegevens blijven op de server. Wat lokaal staat, is hooguit een
  wachtrij met te uploaden documenten, en die is versleuteld.
* **Tokens in de systeemsleutelbos**, niet in een configuratiebestand.
* **Content Security Policy** in de Tauri-configuratie, met alleen het eigen
  API-domein in `connect-src`.
* **Minimale rechten**: alleen de filesystem-API's die nodig zijn voor de
  bestandskiezer, en geen shell-toegang.
* **Ondertekende updates** met een sleutel die apart wordt bewaard; de app
  weigert een update zonder geldige handtekening.
* **Uitloggen wist** de lokale wachtrij en het token.

## Uitrollen

| Platform | Formaat | Ondertekening |
| --- | --- | --- |
| Windows | MSI en NSIS | Authenticode-certificaat |
| macOS | DMG (universal, Intel en Apple Silicon) | Apple Developer ID plus notarisatie |

Beide worden gebouwd in CI vanaf dezelfde tag als de web-release, zodat de
versies niet uit elkaar lopen.
