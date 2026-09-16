/**
 * A profile that looks like somebody has been using this for a fortnight.
 *
 * Every picture we publish — store screenshots, the intro film — is the real
 * app, and the real app with nothing in it sells nothing: no streak, no gems,
 * no progress bar worth looking at. So both start from the same seeded save,
 * and it lives here so the two can never drift apart.
 */
export const seeded = (lang, opts = {}) => {
  const day = (n) => {
    const d = new Date(Date.now() - n * 86400000)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const lessons = {}
  for (const id of ['hruf-1', 'hruf-2', 'hruf-3', 'hruf-4', 'groeten-1', 'groeten-2', 'groeten-3']) {
    lessons[id] = { stars: 3, runs: 2, bestScore: 1, lastDone: Date.now() - 86400000 }
  }
  const cards = {}
  for (const [i, id] of ['salam', 'shukran', 'afak', 'bslama', 'merhba', 'khobz', 'atay', 'lma', 'mama', 'baba',
    'khoya', 'khti', 'wahed', 'jouj', 'tlata', 'hmer', 'zreq', 'khder', 'mesh', 'kelb'].entries()) {
    // The first eight are overdue, the rest are still ahead: that is what a
    // fortnight-old profile looks like, and it gives the review round — and
    // the film that photographs it — something to actually ask.
    const due = i < 8 ? Date.now() - (i + 1) * 3600000 : Date.now() + i * 3600000
    cards[id] = { id, due, strength: 0.4 + (i % 6) * 0.1, seen: 3, reps: 3, ease: 2.4, interval: 1 + (i % 5), lapses: 0 }
  }
  // Somebody who finished four alphabet lessons has met those letters, and
  // somebody who finished three greeting lessons has met their sentences. The
  // profile said otherwise, which left the writing bonus locked in the film.
  const extraCards = {}
  const letters = ['alif', 'ba', 'ta', 'tha', 'jim', 'ha', 'kha', 'dal', 'dhal', 'ra',
    'zay', 'sin', 'shin', 'sad', 'dad', 'ta-emf']
  for (const [i, id] of letters.entries()) {
    extraCards[`l:${id}`] = { id: `l:${id}`, ease: 2.4, interval: 1 + (i % 4),
      due: Date.now() + i * 3600000, strength: 0.35 + (i % 5) * 0.12, seen: 2, reps: 2, lapses: 0 }
  }
  for (const [i, id] of ['groeten-1-a', 'groeten-1-b', 'groeten-2-a', 'groeten-2-b',
    'groeten-3-a', 'groeten-3-b'].entries()) {
    extraCards[`z:${id}`] = { id: `z:${id}`, ease: 2.4, interval: 1 + (i % 3),
      due: Date.now() + i * 5400000, strength: 0.4 + (i % 4) * 0.12, seen: 2, reps: 2, lapses: 0 }
  }

  const daily = {}
  for (let i = 0; i < 7; i++) daily[day(i)] = [40, 55, 30, 62, 45, 80, 35][i]
  return {
    version: 1, name: 'Nour', avatar: '🦊', createdAt: Date.now() - 14 * 86400000,
    xp: 640, gems: 34, hearts: 5, heartsAt: Date.now(), streak: 9, bestStreak: 12,
    lastDay: day(0), freezes: 1, daily, lessons, cards, extraCards, sentencesDone: 22,
    quests: { day: day(0), goed: 14, herhaald: 6, zinnen: 2, lessen: 1, claimed: [] },
    badges: ['eerste-stap', 'salam', 'vlam-3', 'vlam-7', 'letters', 'alfabet'],
    unlocked: true, unlockedAt: Date.now() - 7 * 86400000, langPicked: true, seenTips: ['stem'],
    settings: { lang, theme: 'light', showScript: true, showTranslit: true, sound: true, mediaSound: false,
      mediaSoundPicked: true, film: true, schrijven: true, speech: true,
      // The camera guesses its way to a right answer, and five wrong guesses
      // in a row would end the lesson before it had filmed one.
      hearts: opts.hearts ?? true,
      voiceURI: '', fallbackVoice: true,
      motion: 'full', reading: 'normal', dailyGoal: 50, voiceRate: 0.85 },
  }
}

/** The button that leaves a lesson's opening tip, in every language. */
export const GO_ON = /Aan de slag|Allons-y|Los geht|A por ello|Let’s go/

/** The button under an explanation card, in every language. */
export const GOT_IT = /^(Snap ik!|Compris !|Verstanden!|¡Lo pillo!|Got it!)$/

/** The button that starts a review round, in every language. */
export const START_REVIEW = /Start herhaling|Commencer la révision|Wiederholung starten|Empezar el repaso|Start reviewing/
