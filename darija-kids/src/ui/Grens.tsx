import { Component, type ErrorInfo, type ReactNode } from 'react'
import type { Lang } from '../i18n/languages'

/**
 * Het scherm dat een kind te zien krijgt als er iets omvalt.
 *
 * Hier stond niets. `main.tsx` hing `<App/>` rechtstreeks in de root, en React
 * ontkoppelt bij een onafgevangen fout in een render de hele boom — een wit
 * scherm, zonder tekst en zonder knop.
 *
 * Bij een gewone webapp is dat hinderlijk. Hier is de gebruiker een kind van
 * vier tot tien dat niet kan herladen, niet kan uitleggen wat er gebeurde, en
 * het ook niet aan een ouder kan doorgeven op een manier waarmee die iets kan.
 * En de app leest uit `localStorage`, praat met de Web Speech API en met een
 * betaalplug-in: drie bronnen die op het toestel van een ander anders kunnen
 * antwoorden dan hier. Eén `undefined` uit een oude opgeslagen staat is genoeg.
 *
 * ── Waarom dit bestand niets importeert
 *
 * Geen `useT()`, geen store, geen `kit`. Dit is het enige onderdeel dat moet
 * werken als de rest stuk is, en alles wat het aanraakt kan juist het stuk deel
 * zijn: was de store omgevallen, dan valt `useT()` er meteen achteraan en staat
 * het kind alsnog voor een wit scherm — nu met twee fouten in plaats van één.
 *
 * Om dezelfde reden staan de stijlen erin en niet in de stylesheet: laadde die
 * niet, dan doen klassen niets, en dan is dit scherm ongestyled in plaats van
 * onleesbaar.
 *
 * De taal komt rechtstreeks uit `localStorage`, want die weet de store niet
 * meer. Lukt dat niet, dan Nederlands.
 */

/* De sleutel waaronder de store bewaart. Hier staat hij een tweede keer, omdat
 * dit bestand niets uit de store mag importeren. `Grens.test.ts` leest beide
 * bestanden en valt om zodra ze uit elkaar lopen, dus de dubbeling kan niet
 * stil verjaren. */
const SLEUTEL = 'darijakids.v1'
const OUDE_SLEUTELS = ['bladi.v1', 'gedmma.v1']

/** Hoe vaak het achter elkaar omviel. Per tabblad, dus niet blijvend. */
const TELLER = 'darijakids.grens'

type Tekst = {
  titel: string
  uitleg: string
  knop: string
  ouders: string
  nogmaals: string
  wissen: string
  wisUitleg: string
  som: string
}

/* `Record<Lang, …>` in plaats van los opschrijven: vergeet je een taal, dan is
 * dat een compileerfout en geen kind dat plotseling Nederlands leest. */
const TEKST: Record<Lang, Tekst> = {
  nl: {
    titel: 'Oeps, daar ging iets mis',
    uitleg: 'Het is niet jouw schuld. Druk op de knop, dan beginnen we gewoon opnieuw.',
    knop: 'Opnieuw beginnen',
    ouders: 'Voor de grote mensen',
    nogmaals: 'Het ging twee keer achter elkaar mis. Dan zit er waarschijnlijk iets '
      + 'raars in de opgeslagen gegevens van deze app.',
    wissen: 'Opgeslagen gegevens wissen',
    wisUitleg: 'Dit wist de voortgang op dit toestel. Gekochte boeken en het '
      + 'abonnement blijven; die staan niet hier.',
    som: 'Hoeveel is',
  },
  fr: {
    titel: 'Oups, quelque chose a mal tourné',
    uitleg: "Ce n'est pas ta faute. Appuie sur le bouton et on recommence.",
    knop: 'Recommencer',
    ouders: 'Pour les grandes personnes',
    nogmaals: "Cela a échoué deux fois de suite. Il y a probablement quelque chose "
      + "d'anormal dans les données enregistrées de cette application.",
    wissen: 'Effacer les données enregistrées',
    wisUitleg: 'Cela effacera la progression sur cet appareil. Les livres achetés '
      + "et l'abonnement sont conservés : ils ne sont pas stockés ici.",
    som: 'Combien font',
  },
  de: {
    titel: 'Hoppla, da ist etwas schiefgelaufen',
    uitleg: 'Das ist nicht deine Schuld. Drück auf den Knopf, dann fangen wir einfach neu an.',
    knop: 'Neu anfangen',
    ouders: 'Für die Großen',
    nogmaals: 'Es ist zweimal hintereinander schiefgegangen. Dann stimmt '
      + 'wahrscheinlich etwas mit den gespeicherten Daten dieser App nicht.',
    wissen: 'Gespeicherte Daten löschen',
    wisUitleg: 'Das löscht den Fortschritt auf diesem Gerät. Gekaufte Bücher und '
      + 'das Abo bleiben erhalten; die liegen nicht hier.',
    som: 'Wie viel ist',
  },
  es: {
    titel: 'Uy, algo ha salido mal',
    uitleg: 'No es culpa tuya. Pulsa el botón y empezamos de nuevo.',
    knop: 'Empezar de nuevo',
    ouders: 'Para los mayores',
    nogmaals: 'Ha fallado dos veces seguidas. Probablemente haya algo extraño en '
      + 'los datos guardados de esta aplicación.',
    wissen: 'Borrar los datos guardados',
    wisUitleg: 'Esto borra el progreso en este dispositivo. Los libros comprados y '
      + 'la suscripción se mantienen: no están guardados aquí.',
    som: 'Cuánto es',
  },
  it: {
    titel: 'Ops, qualcosa è andato storto',
    uitleg: 'Non è colpa tua. Premi il pulsante e ricominciamo.',
    knop: 'Ricomincia',
    ouders: 'Per i grandi',
    nogmaals: 'È andato storto due volte di seguito. Probabilmente c\'è qualcosa di '
      + 'strano nei dati salvati di questa applicazione.',
    wissen: 'Cancella i dati salvati',
    wisUitleg: 'Questo cancella i progressi su questo dispositivo. I libri acquistati '
      + 'e l\'abbonamento restano: non sono salvati qui.',
    som: 'Quanto fa',
  },
  en: {
    titel: 'Oops, something went wrong',
    uitleg: "It's not your fault. Press the button and we'll start again.",
    knop: 'Start again',
    ouders: 'For grown-ups',
    nogmaals: 'It went wrong twice in a row. That usually means there is something '
      + 'odd in this app\'s saved data.',
    wissen: 'Clear saved data',
    wisUitleg: 'This clears the progress on this device. Purchased books and the '
      + 'subscription stay; those are not kept here.',
    som: 'What is',
  },
}

const TALEN = Object.keys(TEKST) as Lang[]

/** De taal die de store gebruikte, zonder de store. */
export function taalUitOpslag(ruw: string | null): Lang {
  if (!ruw) return 'nl'
  try {
    const staat = JSON.parse(ruw) as { settings?: { lang?: string } }
    const taal = staat?.settings?.lang
    return TALEN.find((l) => l === taal) ?? 'nl'
  } catch {
    // Onleesbare opslag is precies een van de dingen die deze grens opvangt.
    return 'nl'
  }
}

/** Wist wat deze app bewaart, en niets van iemand anders. */
export function wisOpslag(opslag: Pick<Storage, 'removeItem'>): void {
  for (const k of [SLEUTEL, ...OUDE_SLEUTELS]) {
    try {
      opslag.removeItem(k)
    } catch {
      // Een browser in privémodus mag dit weigeren. Dan is er niets te wissen.
    }
  }
}

/** De som voor de ouder, zoals bij `OuderPoort`: snel voor een grote, te veel voor een kleine. */
export function maakSom(): { tekst: string; waarde: number } {
  const a = 3 + Math.floor(Math.random() * 6)
  const b = 4 + Math.floor(Math.random() * 6)
  return { tekst: `${a} × ${b}`, waarde: a * b }
}

const lees = (sleutel: string, opslag: 'local' | 'session'): string | null => {
  try {
    return (opslag === 'local' ? localStorage : sessionStorage).getItem(sleutel)
  } catch {
    return null
  }
}

type Staat = { fout: Error | null; antwoord: string; som: { tekst: string; waarde: number } }

export class Grens extends Component<{ children: ReactNode }, Staat> {
  override state: Staat = { fout: null, antwoord: '', som: maakSom() }

  private rustig: ReturnType<typeof setTimeout> | null = null

  static getDerivedStateFromError(fout: Error): Partial<Staat> {
    return { fout }
  }

  /**
   * De teller weer op nul als het een tijdje goed gaat.
   *
   * Zonder dit werd hij nooit teruggezet: alleen `wis` doet dat. Eén keer
   * omvallen betekende dan dat élke fout in de rest van die sessie "het ging
   * twee keer achter elkaar mis" te zien gaf, ook als het kind er een kwartier
   * probleemloos mee had gespeeld. Dan staat er iets op het scherm dat niet
   * waar is, met een uitweg eronder die de opgeslagen voortgang weggooit —
   * precies de handeling die je niet op een verkeerde grond wilt aanbieden.
   *
   * "Achter elkaar" betekent: de herlading viel meteen weer om. Twintig
   * seconden is ruim genoeg om dat te onderscheiden van het laden zelf, en
   * kort genoeg om binnen het geduld van een ouder te vallen die net op
   * "opnieuw proberen" heeft gedrukt.
   */
  override componentDidMount(): void {
    if (this.state.fout) return
    this.rustig = setTimeout(() => {
      try {
        sessionStorage.removeItem(TELLER)
      } catch {
        // Geen sessieopslag: dan is er ook niets om terug te zetten.
      }
    }, 20_000)
  }

  override componentWillUnmount(): void {
    if (this.rustig) clearTimeout(this.rustig)
  }

  override componentDidCatch(fout: Error, info: ErrorInfo): void {
    // Niet alleen naar de console: die leest niemand op een telefoon. Het staat
    // ook op het scherm, onder "voor de grote mensen", zodat een ouder kan
    // doorgeven wat er stond.
    console.error('de app viel om', fout, info.componentStack)
    // Eerst de klok stoppen. Valt de app om binnen die twintig seconden, dan
    // zou hij de teller wissen die we hier net ophogen — en dan telt "twee keer
    // achter elkaar" juist nooit.
    if (this.rustig) { clearTimeout(this.rustig); this.rustig = null }
    try {
      sessionStorage.setItem(TELLER, String(Number(lees(TELLER, 'session') ?? '0') + 1))
    } catch {
      // Geen sessieopslag: dan missen we alleen de herhaling, niet het scherm.
    }
  }

  private opnieuw = (): void => {
    location.reload()
  }

  private wis = (): void => {
    if (Number(this.state.antwoord.trim()) !== this.state.som.waarde) {
      this.setState({ som: maakSom(), antwoord: '' })
      return
    }
    try {
      wisOpslag(localStorage)
      sessionStorage.removeItem(TELLER)
    } catch {
      // Niets te wissen; herladen is dan alles wat we kunnen doen.
    }
    location.reload()
  }

  override render(): ReactNode {
    const { fout } = this.state
    if (!fout) return this.props.children

    const t = TEKST[taalUitOpslag(lees(SLEUTEL, 'local'))]
    // Herladen helpt niet als de opgeslagen staat zélf de fout is: dan valt hij
    // meteen weer om, en blijft het kind op dezelfde knop drukken. Bij de tweede
    // keer op rij bieden we de ouder de uitweg.
    //
    // Eén, niet twee: React draait `render` vóór `componentDidCatch`, dus de
    // teller die we hier lezen telt de vorige keren en niet deze. Stond er twee,
    // dan verscheen de uitweg pas bij de derde — terwijl de tekst ernaast zegt
    // dat het twee keer misging.
    const vaker = Number(lees(TELLER, 'session') ?? '0') >= 1

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: '#fff8e6',
          color: '#1f2937',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', lineHeight: 1 }} aria-hidden="true">🐾</div>
          <h1 style={{ margin: '1rem 0 0.5rem', fontSize: '1.5rem', fontWeight: 800 }}>
            {t.titel}
          </h1>
          <p style={{ margin: '0 0 1.5rem', fontSize: '1.0625rem', lineHeight: 1.5 }}>
            {t.uitleg}
          </p>

          <button
            type="button"
            onClick={this.opnieuw}
            style={{
              border: '2px solid #0d9488',
              background: '#14b8a6',
              color: '#fff',
              borderRadius: '1rem',
              padding: '0.875rem 1.75rem',
              fontSize: '1.0625rem',
              fontWeight: 800,
              cursor: 'pointer',
              // Groot genoeg voor een kindervinger, en dat is hier geen detail:
              // dit is de enige knop op het scherm.
              minHeight: '3rem',
              minWidth: '11rem',
            }}
          >
            {t.knop}
          </button>

          <details style={{ marginTop: '2.5rem', textAlign: 'left', fontSize: '0.8125rem' }}>
            <summary style={{ cursor: 'pointer', color: '#6b7280' }}>{t.ouders}</summary>

            <pre
              style={{
                marginTop: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                color: '#374151',
                fontSize: '0.75rem',
              }}
            >
              {fout.message || String(fout)}
            </pre>

            {vaker && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem', color: '#374151' }}>{t.nogmaals}</p>
                <p style={{ margin: '0 0 0.75rem', color: '#6b7280' }}>{t.wisUitleg}</p>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
                  {t.som} {this.state.som.tekst}?{' '}
                  <input
                    inputMode="numeric"
                    value={this.state.antwoord}
                    onChange={(e) => this.setState({ antwoord: e.target.value })}
                    style={{
                      width: '4.5rem',
                      padding: '0.375rem',
                      border: '1px solid #9ca3af',
                      borderRadius: '0.375rem',
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={this.wis}
                  style={{
                    border: '1px solid #c34a2c',
                    background: '#fff',
                    color: '#c34a2c',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t.wissen}
                </button>
              </div>
            )}
          </details>
        </div>
      </div>
    )
  }
}
