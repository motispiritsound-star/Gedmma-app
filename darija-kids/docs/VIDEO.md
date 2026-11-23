# The film script

For Steve AI, or any tool that turns a script into video. In English, because
that is what these tools read best — the spoken version can be recorded in
Dutch, French or Arabic afterwards without changing a single shot.

Three lengths, from the same material. Make the sixty first; the others are
cut out of it.

## Stop: the existing films may not be used in the campaign

> **Every film already made from this script says, spoken aloud, "The first
> four lessons are free." Since 23 November that is not true.** There are no
> free lessons and no trial any more: the app is free to download, the course
> is a subscription, and that is asked on the first screen. The reasoning is
> in the note above `magLeren` in `src/engine/store.ts`; the decision itself
> is the entry of 23 November in `docs/STAND.md`.
>
> That line cannot be repaired in this file. It is in the voice track and in
> the edit, so **no existing film goes on the French, Dutch or German Facebook
> pages until it has been voiced again** with the closing line of scene 13
> below. This is the kind of mistake a store rejects an app for: a film that
> promises something free which the app does not give.

**Where those films are.** The finished ad is not in this repository: it is
exported out of Steve AI (`store/lancering/reclamefilm.md`, step 8) and lives
on the Windows machine and wherever it was uploaded. What *is* tracked here is
`site-assets/film/<taal>/intro.mp4` (with `poster.webp`) for de, en, es, fr, it
and nl — twenty-eight seconds of the app itself from `npm run intro`, with the
app's own sound and no voice-over, so they do not carry this line. Their own
problem is the price card on the last frame, which `store/lancering/socials.md`
describes. `store/video/<taal>/` holds the same recording in three aspect
ratios and is not in the repository (`.gitignore`, line 8).

`docs/STAND.md` already lists the ad films as not repairable without
re-recording — in the entry of 12 November, written when the number was still
going from four to eight — and records under 3 November that they were shared
in the Facebook groups. Whatever is still up there says four free lessons.

To see which exported films are on the Windows machine, newest first:

```powershell
Get-ChildItem $HOME -Recurse -Depth 5 -Include *.mp4 -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 40 FullName, LastWriteTime
```

## Before you paste anything

**Voice.** One voice, male, warm, unhurried. Not an announcer — a father
telling you something he has thought about for a long time. Slightly accented
English is better here than perfect English: the audience is Moroccan
families in Europe, and they should hear one of their own.

**Music.** Something with an oud or a gimbri under it, quiet, no percussion
until the halfway mark. Nothing triumphant. It should feel like a kitchen, not
a commercial.

**Pace.** Every scene holds for at least three seconds. The most common
mistake in these tools is cutting every 1.5 seconds; that reads as an advert
and people scroll past adverts.

**On-screen text.** Short. Most people watch without sound. Every line below
is written to be readable in under two seconds.

**Never on screen:** a real child's face you do not have permission for, and
any brand or logo that is not yours.

## The sixty-second film

| # | Seconds | What you see | Voice-over | On screen |
|---|---|---|---|---|
| 1 | 0–4 | A phone on a kitchen table, ringing. A grandmother's name on the screen. | — | — |
| 2 | 4–9 | An older woman in Morocco, speaking warmly into a phone. Sunlight, a courtyard. | "Your mother calls. She speaks the language you grew up in." | — |
| 3 | 9–14 | A child of about eight holds the phone, listening, then looks at their parent, stuck. | "Your child understands every word." | — |
| 4 | 14–18 | Close on the child's face. A small shrug. | "They just can't answer her." | *Understands everything. Answers in Dutch.* |
| 5 | 18–23 | The parent takes the phone back and translates. Something passes over their face. | "And you translate. Again." | — |
| 6 | 23–27 | Black. One line of text. | — | *A language disappears in one generation.* |
| 7 | 27–31 | The app opens. The learning path, seventeen units. | "So we built this." | *Darijaforkids* |
| 8 | 31–36 | A lesson: a word in Arabic script, a finger taps, the word is spoken. | "Darija — the Moroccan Arabic people actually speak. Not textbook Arabic." | — |
| 9 | 36–41 | The alphabet screen: one letter in its three shapes. A finger traces it. | "The whole Arabic alphabet. Three hundred words. A hundred sentences." | — |
| 10 | 41–46 | A child playing the app on a sofa, laughing at something. Two minutes on a clock. | "Two minutes a day. It feels like a game, because it is one." | *Two minutes a day* |
| 11 | 46–51 | Split second of the history cards, a story, the review stack. | "Recorded by a Moroccan voice. No account. No adverts. Works offline." | *No account · No adverts · Works offline* |
| 12 | 51–56 | The same child, on the phone again. They say one sentence in Darija. The grandmother's face lights up. | "Until the day your child answers her." | — |
| 13 | 56–60 | Logo, the flag, the address. | "Darijaforkids. Free to download, no ads." | *darijaforkids.eu · Free to download · No ads* |

### The closing line, per voicing

The spoken version of this script is recorded in other languages (see the top
of this file), and scene 13 is the one line that has to be right in every one
of them. The wording below follows what the site already says in
`src/site/copy.ts` (`trustLine`), so the film and the site promise the same
thing. Six languages, because the films exist in six: `site-assets/film/`.

| | Voice-over | On screen |
|---|---|---|
| English | "Darijaforkids. Free to download, no ads." | *darijaforkids.eu · Free to download · No ads* |
| Dutch | "Darijaforkids. Gratis te downloaden, zonder advertenties." | *darijaforkids.eu · Gratis te downloaden · Geen advertenties* |
| French | "Darijaforkids. Téléchargement gratuit, sans publicité." | *darijaforkids.eu · Téléchargement gratuit · Sans publicité* |
| German | "Darijaforkids. Kostenloser Download, ohne Werbung." | *darijaforkids.eu · Kostenloser Download · Keine Werbung* |
| Spanish | "Darijaforkids. Descarga gratuita, sin anuncios." | *darijaforkids.eu · Descarga gratuita · Sin anuncios* |
| Italian | "Darijaforkids. Download gratuito, senza pubblicità." | *darijaforkids.eu · Download gratuito · Senza pubblicità* |

The top of this file also names Arabic as a voicing. There is no Arabic
marketing copy anywhere in this repository — the interface runs in those six
languages only, see `src/i18n/` — so that line is deliberately not written
here. Ask the Moroccan voice to say it in Darija and write down what they
actually said, rather than translating it out of the Dutch.

The written-out scripts beside this file are not all up to date:
`docs/film/filmscript-nl.txt` carries the Dutch line above, but
`docs/film/filmscript-fr.txt` still has the old French one on lines 81 and 82.
France is one of the three campaign countries, so that is the next one to fix.

## The thirty-second cut

Scenes **2, 3, 4, 6, 7, 8, 10, 12, 13**, in that order, four seconds each,
last one longer. The whole middle explanation goes; the phone call stays. If
you have to lose more, lose scene 8 — not scene 12.

## The fifteen-second cut, for social

| Seconds | What you see | On screen |
|---|---|---|
| 0–3 | The grandmother speaking on the phone | — |
| 3–6 | The child listening, then stuck | *Understands everything.* |
| 6–8 | The parent translating | *Answers in Dutch.* |
| 8–12 | The app, a word spoken aloud, a child repeating it | *Two minutes a day* |
| 12–15 | The child says one sentence. The grandmother laughs. | *darijaforkids.eu* |

No voice-over on this one. The word being spoken in the app is the only sound
besides the music. It is the whole point of the product and it is the one
thing a competitor cannot copy in an afternoon.

## What to feed the tool

Paste the voice-over column as the script and the "what you see" column as the
scene directions. Then replace the generated app shots with the real ones —
that matters more than anything else in this document. Stock footage of a
generic learning app makes the whole film look like a template, and people
recognise a template in half a second.

The real screens are in `site-assets/shots/<taal>/`, and there is already a
finished film of the app itself in `store/video/<taal>/` if you would rather
cut that in whole. Two things in that material are out of date, and one of
them promises something the app no longer gives, so check before you paste:

- **Not `10.webp`.** That is the offer screen, and the pictures in the
  repository are the ones shot on 22 September: the footer still reads *3 dagen
  gratis*, and the first price block turns the year into a month without the
  amount that is actually charged beside it. Neither holds since 23 November,
  and `scripts/make-screenshots.mjs` no longer writes either of them — but the
  pictures only change once the screenshots are generated again.
  `store/lancering/website.md`, under *De foto's en de film zijn van 22
  september*, has that sequence. English has no `10.webp`, on purpose.
- **The last frame of `store/video/<taal>/intro-*.mp4`** shows a price that
  does not exist. `store/lancering/socials.md` says which one and what has to
  happen before that film is used again.

## The line that carries it

If everything else goes, this stays:

> **Your child understands their grandmother. They just can't answer her.**

Everything in the film is there to set up that sentence or to answer it.
