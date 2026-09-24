# Antwoord aan App Review — richtlijn 4.2

Plakken in **App Store Connect → Distribution → iOS App 1.0 → App Review →
Notes**, of als antwoord op het bericht van App Review. Pas het nadat build 5
is geüpload: een beoordelaar leest dit naast de app die er dan ligt.

```
Thank you for the review.

We have addressed guideline 4.2 by adding functionality a web browser cannot
provide, and by fixing one feature that was silently unavailable on iOS.

1. Microphone — speaking practice.
The app now records the learner saying a word and plays it back next to a
native-speaker recording (the speaking round, in the Bonus tab). We
deliberately do not use speech recognition: no engine supports Moroccan
Darija. They are all trained on Modern Standard Arabic, which is a different
language with the same letters. Recording and self-comparison is the honest
and effective alternative for this language.

This exercise previously depended on the Web Speech API, which does not exist
in WKWebView, so the round was hidden on iPhone and iPad. That is fixed, and
the app now offers the five bonus rounds its description promises.

2. Haptics.
Correct and incorrect answers, tracing an Arabic letter and finishing a lesson
now give haptic feedback. Safari on iOS has no vibration API at all, so this
is only possible inside the app.

3. Local notifications.
An optional daily practice reminder, at a time the parent chooses, scheduled
on the device. There is no push server and no tokens.

4. iPad layout.
The browsing screens now use the width of an iPad instead of a phone-width
column.

Context that may help the review:

- The app works entirely offline. All 17 units, 432 audio recordings, the
  fonts and the illustrations are bundled in the binary. The app makes no
  network request at any point; there is no server behind it.
- There is no account and no sign-in. A child enters nothing at all.
- Nothing recorded with the microphone leaves the device. It is played back
  and then discarded.
- The first four lessons are free. To see the whole course, please start the
  free trial with a sandbox account, or let us know and we will arrange
  access.

Kind regards,
Adil Bekkali
```
