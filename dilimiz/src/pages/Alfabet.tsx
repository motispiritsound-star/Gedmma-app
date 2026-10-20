import { LASTIGE_LETTERS, LETTERS } from '../content/letters'
import { KLANKPAREN } from '../content/klankparen'
import { speel } from '../engine/audio'
import { useT, useTaal } from '../i18n'
import { Kaart, Knop, Kop, Tr, Uitleg } from '../ui/kit'

/**
 * Het alfabet als naslag.
 *
 * De zes lastige letters bovenaan en de rest eronder, en niet alfabetisch van
 * a tot z. Een kind dat hier komt, komt omdat het `ğ` niet snapt -- niet om
 * `b` op te zoeken.
 *
 * Geen lettervormen voor begin, midden en eind, en geen natekenen: Turks is
 * Latijns schrift en een letter ziet er overal hetzelfde uit. Dat is het
 * grootste verschil met de app waar de techniek van komt.
 */
export function Alfabet() {
  const t = useT()
  const taal = useTaal()
  const rest = LETTERS.filter((l) => !l.lastig)

  return (
    <div className="blad blad--met-tabs">
      <Kop onder={t.alfabet.uitleg}>{t.alfabet.kop}</Kop>

      <section className="kolom kolom--wijd">
        <h2>{t.alfabet.lastig}</h2>
        {LASTIGE_LETTERS.map((l) => (
          <Kaart key={l.id}>
            <div className="kolom">
              <div className="rij rij--tussen">
                <Tr groot>{l.klein} {l.hoofd}</Tr>
                {l.voorbeeld ? (
                  <Knop
                    soort="stil"
                    klein
                    onClick={() => speel(`l-${l.id}`, l.voorbeeld!)}
                    aria-label={`${t.les.hoorHet}: ${l.voorbeeld}`}
                  >
                    🔊 <Tr>{l.voorbeeld}</Tr>
                  </Knop>
                ) : null}
              </div>
              <p className="klein" style={{ margin: 0 }}>
                <strong>{t.alfabet.klinkt}</strong> <Uitleg tekst={l.klank[taal]} />
              </p>
            </div>
          </Kaart>
        ))}
      </section>

      <section className="kolom kolom--wijd" style={{ marginTop: 'var(--ruimte-6)' }}>
        <h2>{t.les.welkHoordeJe}</h2>
        <p className="zacht klein" style={{ margin: 0 }}>
          {/* De klankparen staan hier als naslag: twee echte woorden die in één
              letter verschillen. Dat is wat het verschil hoorbaar maakt. */}
        </p>
        {KLANKPAREN.map((p) => (
          <Kaart key={p.id} in>
            <div className="rij rij--tussen">
              {([p.links, p.rechts] as const).map((kant, i) => (
                <button
                  key={i}
                  type="button"
                  className="tegel"
                  onClick={() => speel(`p-${p.id}-${i === 0 ? 'links' : 'rechts'}`, kant.tr)}
                  style={{ flex: 1 }}
                >
                  <span className="kolom" style={{ gap: 0, alignItems: 'center' }}>
                    <Tr>{kant.tr}</Tr>
                    <span className="zacht klein" style={{ fontWeight: 400 }}>{kant.betekenis[taal]}</span>
                  </span>
                </button>
              ))}
            </div>
          </Kaart>
        ))}
      </section>

      <section className="kolom" style={{ marginTop: 'var(--ruimte-6)' }}>
        <h2>{t.alfabet.rest}</h2>
        <div className="tegels">
          {rest.map((l) => (
            <button
              key={l.id}
              type="button"
              className="tegel"
              title={l.klank[taal]}
              onClick={() => l.voorbeeld && speel(`l-${l.id}`, l.voorbeeld)}
              aria-label={`${l.klein} ${l.hoofd}`}
            >
              <Tr>{l.klein} {l.hoofd}</Tr>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
