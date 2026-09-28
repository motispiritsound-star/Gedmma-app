# Apple, richtlijn 1.3 — de vier vragen

App Review vraagt bij de Kinderen-categorie om aanvullende informatie. Hieronder
staat eerst wat er is nagegaan en waar dat in de code staat, en daarna de tekst
die je in App Store Connect kunt plakken.

Antwoord in App Store Connect op het bericht zelf, niet via een nieuw
inzendformulier — dan komt het bij dezelfde beoordelaar terecht.

---

## Wat er is nagegaan

Elk antwoord hieronder is uit de code gehaald, niet uit het hoofd.

| Vraag | Waar het is gecontroleerd |
|---|---|
| Analytics | De tien productie-afhankelijkheden in `package.json`. Geen enkele is een analytics- of trackingpakket |
| Advertenties | Idem, plus een zoekactie op admob, adsense, facebook, gtag en googletag door de hele bron: nul treffers |
| Wat de app verstuurt | `src/engine/post.ts` — de app doet precies twee verzoeken naar buiten, allebei naar onze eigen server |
| De microfoon | `src/engine/microfoon.ts` en `src/pages/Record.tsx` — geen `fetch`, geen upload; de opname blijft in het geheugen van het toestel |
| Spraakherkenning | `src/ui/exercises.tsx` — in een WKWebView bestaat `SpeechRecognition` niet, dus in de app draait altijd de opnemen-en-terugluisteren-oefening |

---

## De tekst voor App Store Connect

> Thank you for reviewing Darijaforkids. Below are complete answers to the four
> questions. They describe version 1.0 of the iOS app as submitted.
>
> **1. Does the app include third-party analytics?**
>
> No. The app contains no analytics SDK of any kind and performs no analytics
> requests. We do not count installs, sessions, screen views or any other usage
> metric. The app's ten production dependencies are React, React DOM, React
> Router, Framer Motion, canvas-confetti, four Capacitor plugins (App, Core,
> Haptics, Local Notifications) and cordova-plugin-purchase. None of them is an
> analytics or attribution library.
>
> **2. Does the app include third-party advertising?**
>
> No. There is no advertising of any kind: no ad SDK, no ad network, no
> interstitials, no rewarded video, no cross-promotion of other apps, and no
> sponsored content. Nothing in the app is paid placement.
>
> **3. Will the data be shared with any third parties?**
>
> No data is sold, rented or shared for anyone else's purposes. There are no
> data brokers and no advertising partners.
>
> Three service providers process data strictly on our instructions, under a
> data processing agreement, and only to deliver the functions below:
>
> - **Cloudflare** — hosts the API the app talks to, and stores the parent's
>   e-mail address and consent record in a Cloudflare D1 database.
> - **Brevo** (Sendinblue SAS, France) — delivers the confirmation e-mail and,
>   if the parent asked for it, the weekly note. Brevo is an EU company and the
>   data stays within the EU.
> - **Apple** — processes in-app purchases. The app receives only the
>   transaction receipt from StoreKit; we never see payment details.
>
> **4. Is the app collecting any user or device data for purposes beyond
> third-party analytics or third-party advertising?**
>
> The app collects no data at all from a child, and nothing whatsoever is
> collected unless a parent actively chooses it.
>
> *Stays on the device and is never transmitted:* learning progress, XP, streak,
> the words practised, app settings, and the display name and avatar if the
> child enters one. Microphone recordings from the "say it after me" exercise
> are held in memory so the child can hear themselves back, and are never
> uploaded, stored on our servers or analysed. The app performs no speech
> recognition of any kind and contains no speech-recognition code.
>
> *Transmitted, only after a parent passes a parental gate and opts in:*
>
> - The parent's e-mail address, their interface language, and which of the two
>   optional mailings they chose. This is used only to send those mailings and
>   to record consent under the GDPR. The address is confirmed by e-mail before
>   anything is sent.
> - If — and only if — the parent asked for the weekly progress note: five
>   integers, sent at most once per day under a random identifier. They are the
>   number of units completed, lessons completed, words seen, the best streak,
>   and total XP. No words, no answers, no timestamps of individual sessions,
>   and nothing that describes how a particular child performed on a particular
>   day.
>
> *Never collected, anywhere in the app:* no advertising identifier, no IDFA, no
> device identifier, no IP address stored in readable form (our server keeps
> only a salted hash, to rate-limit e-mail sending), no location, no contacts,
> no photos, no health data, and no biometric data.
>
> A child using the app without a parent ever signing up transmits nothing at
> all.
>
> Spending money and entering an e-mail address are both placed behind a
> parental gate (an arithmetic question), as are the three links that leave the
> app. The privacy policy inside the app, under "For parents", states the same
> in all six interface languages.
>
> We are happy to provide any further detail you need.

---

## Wat je nog moet invullen

Niets. Alles hierboven is uit de code gecontroleerd. Lees het wel één keer
door: jij bent de uitgever, en jij ondertekent dit.

---

## Eén ding dat hier niet in staat, en waarom

Op de **website** (niet in de app) is er één pad dat wél spraakherkenning van
de browser gebruikt: Chrome op een computer biedt `webkitSpeechRecognition`
aan, en dan gaat het geluidsfragment naar de servers van Google. In de app
gebeurt dat nooit — een WKWebView kent die API niet — dus het antwoord aan
Apple klopt.

Maar de privacytekst zegt "geen trackers, geen analytics, geen cookies van
derden", en op de website is er dan wel een moment waarop de stem van een kind
naar Google gaat. Dat is geen tracker, maar het is ook niet niets.

Mijn voorstel: haal dat pad weg en gebruik overal de opnemen-en-terugluisteren-
oefening. De code zegt er zelf al over dat herkenning voor Darija niet kan
werken, want elke motor is getraind op Standaardarabisch. Dan is het een
functie die niet doet wat ze belooft én een gegevensstroom die je niet nodig
hebt.

Dat is een productbesluit, dus ik heb het niet gedaan. Zeg het maar.
