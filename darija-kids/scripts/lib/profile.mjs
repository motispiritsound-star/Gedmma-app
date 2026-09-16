/**
 * A profile that looks like somebody has been using this for a fortnight.
 *
 * Every picture we publish — store screenshots, the intro film — is the real
 * app, and the real app with nothing in it sells nothing: no streak, no gems,
 * no progress bar worth looking at. So both start from the same seeded save,
 * and it lives here so the two can never drift apart.
 */
export const seeded = (lang) => {
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
    cards[id] = { id, due: Date.now() + i * 3600000, strength: 0.4 + (i % 6) * 0.1, seen: 3, lapses: 0 }
  }
  const daily = {}
  for (let i = 0; i < 7; i++) daily[day(i)] = [40, 55, 30, 62, 45, 80, 35][i]
  return {
    version: 1, name: 'Nour', avatar: '🦊', createdAt: Date.now() - 14 * 86400000,
    xp: 640, gems: 34, hearts: 5, heartsAt: Date.now(), streak: 9, bestStreak: 12,
    lastDay: day(0), freezes: 1, daily, lessons, cards, extraCards: {}, sentencesDone: 22,
    quests: { day: day(0), goed: 14, herhaald: 6, zinnen: 2, lessen: 1, claimed: [] },
    badges: ['eerste-stap', 'salam', 'vlam-3', 'vlam-7', 'letters', 'alfabet'],
    unlocked: true, unlockedAt: Date.now() - 7 * 86400000, langPicked: true, seenTips: ['stem'],
    settings: { lang, theme: 'light', showScript: true, showTranslit: true, sound: true, mediaSound: false,
      mediaSoundPicked: true, film: true, schrijven: true, speech: true, hearts: true, voiceURI: '', fallbackVoice: true,
      motion: 'full', reading: 'normal', dailyGoal: 50, voiceRate: 0.85 },
  }
}

/** The button that leaves a lesson's opening tip, in every language. */
export const GO_ON = /Aan de slag|Allons-y|Los geht|A por ello|Let’s go/

/** The button under an explanation card, in every language. */
export const GOT_IT = /^(Snap ik!|Compris !|Verstanden!|¡Lo pillo!|Got it!)$/
