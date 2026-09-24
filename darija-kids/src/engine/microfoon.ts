/**
 * De microfoon.
 *
 * Er bestaat geen spraakherkenning die Darija kent. Elke motor op elk toestel
 * is getraind op Standaardarabisch, en dat is een andere taal met dezelfde
 * letters — dat staat al in `Record.tsx` en het is de reden dat de opnames in
 * deze app door mensen zijn ingesproken.
 *
 * Dus doet de app niet alsof. Ze herkent niets en keurt niets goed of af. Ze
 * neemt op, en laat je jezelf terughoren vlak na de stem die het goed zegt.
 * Dat is wat een leraar doet, en het is het enige eerlijke antwoord op een
 * taal waarvoor geen enkele computer een oor heeft.
 *
 * Waarom het hier staat en niet in `audio.ts`: dit is het enige stuk van de
 * app dat om toestemming vraagt. Dat hoort op één plek, zodat je in één
 * bestand kunt nalezen wanneer die microfoon aan staat — en, belangrijker,
 * wanneer hij weer uit gaat.
 */

/** Of dit toestel kan opnemen. Op het web hangt dat van de browser af. */
export const kanOpnemen = (): boolean =>
  typeof navigator !== 'undefined'
  && typeof navigator.mediaDevices?.getUserMedia === 'function'
  && typeof MediaRecorder !== 'undefined'

/** Wat een lopende opname kan: stoppen, en dan hoor je wat het werd. */
export interface Opname {
  /** Stopt en geeft een adres terug waar de opname te beluisteren is. */
  stop: () => Promise<string>
  /** Stoppen en weggooien, voor wie halverwege bedenkt dat het niet hoeft. */
  weg: () => void
}

/**
 * Het beste formaat dat dit toestel aankan.
 *
 * Safari neemt op in mp4 en kent webm niet; Chrome andersom. Laat je het over
 * aan de standaard, dan krijg je op een iPhone een bestand dat de app zelf
 * niet kan afspelen.
 */
const soort = (): string => {
  for (const s of ['audio/mp4', 'audio/webm']) {
    if (MediaRecorder.isTypeSupported(s)) return s
  }
  return ''
}

/**
 * De stroom van de microfoon, en waarom hij niet blijft staan.
 *
 * Zolang een stroom open is, brandt op een iPhone het oranje stipje en denkt
 * een ouder dat de app meeluistert. Dat mag niet, en het is ook niet waar.
 * Daarom gaat hij na elke opname dicht en wordt hij bij de volgende opnieuw
 * gevraagd — dat kost een fractie van een seconde en is het waard.
 */
const sluit = (stroom: MediaStream): void => {
  for (const spoor of stroom.getTracks()) spoor.stop()
}

/** Begint op te nemen. Vraagt de eerste keer toestemming aan de gebruiker. */
export async function neemOp(): Promise<Opname> {
  const stroom = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  })
  const type = soort()
  const recorder = new MediaRecorder(stroom, type ? { mimeType: type } : undefined)
  const stukken: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size) stukken.push(e.data)
  }
  recorder.start()

  return {
    stop: () =>
      new Promise<string>((klaar) => {
        recorder.onstop = () => {
          sluit(stroom)
          klaar(URL.createObjectURL(new Blob(stukken, type ? { type } : undefined)))
        }
        if (recorder.state === 'inactive') {
          sluit(stroom)
          klaar('')
          return
        }
        recorder.stop()
      }),
    weg: () => {
      if (recorder.state !== 'inactive') recorder.stop()
      sluit(stroom)
    },
  }
}
