/**
 * Iets op het klembord zetten, zonder het op het scherm te zetten.
 *
 * Bedoeld voor het koopgeheim. Dat stond eerst gewoon afgedrukt, met de
 * mededeling "zet hem niet in een chat" eronder — en toen belandde hij twee
 * keer in een chat, allebei de keren omdat er een schermafdruk van werd
 * gemaakt. Dat is geen onvoorzichtigheid van wie hem stuurt maar van wie hem
 * afdrukt: als de enige manier om een waarde over te nemen is hem te lezen,
 * dan wordt hij gelezen, en alles wat gelezen kan worden kan gefotografeerd
 * worden.
 *
 * Op het klembord kan hij rechtstreeks van de opdracht naar het veld bij de
 * betaalpartner, zonder dat een mens of een scherm hem onderweg ziet.
 *
 * Werkt het niet — een kale server, geen klembord — dan zegt deze functie
 * gewoon nee en drukt de aanroeper hem alsnog af. Beter zichtbaar dan
 * onbruikbaar.
 */
import { execFileSync } from 'node:child_process'

/** Probeert het; geeft terug of het gelukt is. */
export function naarKlembord(tekst) {
  const pogingen = process.platform === 'win32'
    ? [['clip.exe', []]]
    : process.platform === 'darwin'
      ? [['pbcopy', []]]
      : [['wl-copy', []], ['xclip', ['-selection', 'clipboard']], ['xsel', ['--clipboard', '--input']]]

  for (const [opdracht, argumenten] of pogingen) {
    try {
      execFileSync(opdracht, argumenten, { input: tekst, stdio: ['pipe', 'ignore', 'ignore'] })
      return true
    } catch {
      /* de volgende proberen */
    }
  }
  return false
}
