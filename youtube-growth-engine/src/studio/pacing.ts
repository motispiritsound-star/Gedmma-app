import type { Script } from '../domain/types.js'

/**
 * Meetbare tempo-regels, afgeleid uit wat werkende faceless-kanalen doen.
 *
 * De bron hiervoor is een blogpost op sociale media, dus behandeld zoals de
 * opdracht voorschrijft: als hypothese. Wat er overblijft als je de beweringen
 * over omzet wegstreept, zijn drie dingen die je wél kunt meten — hoe snel de
 * hook landt, waar hij niet mee mag beginnen, en hoe vaak er een nieuwe haak
 * in het script zit. Die drie staan hieronder.
 */

/** Woorden per seconde bij rustig Nederlands voorlezen. */
export const SPEAKING_RATE = 2.2

/** Openingen die het script nooit gebruikt. */
export const BANNED_OPENINGS = [
  'welkom terug', 'welkom bij', 'hallo allemaal', 'hoi allemaal',
  'in deze video', 'vandaag gaan we', 'vandaag bespreken we',
  'voordat we beginnen', 'vergeet niet te abonneren', 'abonneer je',
  'welcome back', 'in this video', 'before we begin', "don't forget to subscribe",
  'hey guys', 'what is up',
]

export interface PacingReport {
  hookSeconds: number
  hookWithinFive: boolean
  bannedOpening?: string
  loopsFound: number
  loopsExpected: number
  loopDensityOk: boolean
  firstRewardSecond: number
  rewardOnTime: boolean
  estimatedWords: number
  estimatedSeconds: number
  /** Alles wat niet klopt, in gewone taal. */
  problems: string[]
}

const seconds = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length / SPEAKING_RATE

/**
 * `every` is het aantal seconden waarbinnen er een nieuwe haak hoort te zitten.
 * 45 seconden is de gangbare vuistregel; hij staat hier als parameter omdat we
 * hem na de eerste tien video's tegen onze eigen retentiecijfers ijken in
 * plaats van hem te geloven.
 */
export function analysePacing(
  script: Script, targetSeconds: number, every = 45,
): PacingReport {
  const problems: string[] = []

  const hookSeconds = seconds(script.hook)
  const hookWithinFive = hookSeconds <= 5
  if (!hookWithinFive) {
    problems.push(
      `De hook duurt ${hookSeconds.toFixed(1)} seconden. De eerste vijf beslissen ` +
      'of iemand blijft; zet de verrassing vooraan en kort de aanloop weg.',
    )
  }

  const opening = script.hook.trim().toLowerCase()
  const bannedOpening = BANNED_OPENINGS.find((b) => opening.startsWith(b))
  if (bannedOpening) {
    problems.push(
      `Het script opent met "${bannedOpening}". Dat is een aanloop, geen opening: ` +
      'begin bij het conflict of het cijfer dat verbaast.',
    )
  }

  const loopsFound = script.segments.filter((s) => s.opensLoop).length
  const loopsExpected = Math.max(1, Math.floor(targetSeconds / every))
  const loopDensityOk = loopsFound >= Math.ceil(loopsExpected * 0.6)
  if (!loopDensityOk) {
    problems.push(
      `${loopsFound} open loop(s) over ${Math.round(targetSeconds / 60)} minuten; ` +
      `ongeveer ${loopsExpected} verwacht. Tussen twee haken in zakt de aandacht weg.`,
    )
  }

  const closed = script.segments.filter((s) => s.closesLoop).length
  if (closed < loopsFound) {
    problems.push(
      `${loopsFound - closed} open loop(s) worden nooit gesloten. Een haak die ` +
      'niet wordt ingelost, kost vertrouwen in plaats van kijktijd.',
    )
  }

  const firstRewardSecond = hookSeconds + seconds(script.promise)
  const rewardOnTime = firstRewardSecond <= 30
  if (!rewardOnTime) {
    problems.push(
      `De eerste inhoudelijke beloning komt pas op ${Math.round(firstRewardSecond)} ` +
      'seconden. Binnen dertig seconden moet er iets staan wat de kijker nog niet wist.',
    )
  }

  const estimatedWords = [
    script.hook, script.promise, ...script.segments.map((s) => s.body),
    script.counterArgument, script.conclusion, script.callToAction,
  ].join(' ').trim().split(/\s+/).filter(Boolean).length

  const estimatedSeconds = estimatedWords / SPEAKING_RATE
  const drift = Math.abs(estimatedSeconds - targetSeconds) / targetSeconds
  if (drift > 0.2) {
    problems.push(
      `Geschatte lengte ${Math.round(estimatedSeconds)} seconden tegen een doel van ` +
      `${targetSeconds}. Dat wijkt ${Math.round(drift * 100)}% af.`,
    )
  }

  return {
    hookSeconds: Math.round(hookSeconds * 10) / 10,
    hookWithinFive,
    ...(bannedOpening ? { bannedOpening } : {}),
    loopsFound,
    loopsExpected,
    loopDensityOk,
    firstRewardSecond: Math.round(firstRewardSecond),
    rewardOnTime,
    estimatedWords,
    estimatedSeconds: Math.round(estimatedSeconds),
    problems,
  }
}
