/**
 * Wat er meekomt met "Voortgang terugzetten", en wat niet.
 *
 * De knop heet "Voortgang terugzetten" en niet "Alles terugzetten", en toch
 * kwamen de instellingen mee. Het ergste geval dat zo'n knop kan geven zat
 * daarin: de taal. Wie een bestand van een Frans sprekend neefje terugzette,
 * kreeg een Franse app — en moest zijn eigen taal terugzoeken in een menu dat
 * hij niet meer kon lezen. Hij drukte op die knop om voortgang terug te halen.
 *
 * Daar komt bij dat een deel van die instellingen alleen op één toestel iets
 * betekent: `voiceURI` is de naam van een stem die op de andere telefoon stond.
 *
 * `resetProgress` deed het al goed en hield de instellingen. Deze test zet
 * vast dat de twee niet meer uit elkaar lopen.
 */
import { describe, expect, it } from 'vitest'
import { exportProgress, getState, importProgress, setSetting, setState, type State } from './store'

/** Een bewaard bestand van een ánder toestel, met andere instellingen erin. */
function anderToestel(): string {
  const eigen = JSON.parse(exportProgress()) as State
  return JSON.stringify({
    ...eigen,
    xp: 4321,
    streak: 9,
    settings: { ...eigen.settings, lang: 'fr', theme: 'dark', voiceURI: 'stem-die-hier-niet-bestaat' },
    langPicked: true,
  })
}

describe('terugzetten', () => {
  it('neemt de voortgang over', () => {
    const bestand = anderToestel()
    expect(importProgress(bestand)).toBe(true)
    expect(getState().xp).toBe(4321)
    expect(getState().streak).toBe(9)
  })

  it('maar laat de taal van dit toestel staan', () => {
    setSetting('lang', 'nl')
    expect(importProgress(anderToestel())).toBe(true)
    expect(getState().settings.lang).toBe('nl')
  })

  it('en de rest van de instellingen ook', () => {
    setSetting('theme', 'light')
    setSetting('voiceURI', 'stem-van-hier')
    expect(importProgress(anderToestel())).toBe(true)
    expect(getState().settings.theme).toBe('light')
    expect(getState().settings.voiceURI).toBe('stem-van-hier')
  })

  /**
   * `langPicked` is de vraag of het welkomstscherm al geweest is op dít
   * toestel. Stond hij in het bestand aan, dan sloeg hij hier het welkom over
   * bij iemand die het nog nooit had gezien.
   */
  it('en of het welkomstscherm hier al geweest is', () => {
    setState({ langPicked: false })
    expect(importProgress(anderToestel())).toBe(true)
    expect(getState().langPicked).toBe(false)
  })

  /** De aankoop kwam al niet mee: het bestand is gewone tekst. */
  it('en de aankoop komt niet mee', () => {
    const eigen = JSON.parse(exportProgress()) as State
    expect(importProgress(JSON.stringify({ ...eigen, unlocked: true }))).toBe(true)
    expect(getState().unlocked).toBe(false)
  })

  it('en een bestand van een andere versie wordt niet gelezen', () => {
    expect(importProgress('{"version":2}')).toBe(false)
    expect(importProgress('geen json')).toBe(false)
  })
})
