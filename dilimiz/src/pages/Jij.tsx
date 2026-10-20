import { Link } from 'react-router-dom'
import { ACCENTEN, ACCENTKLEUR, ACCENTNAAM, type Accent } from '../merk/kleuren'
import { sterkteNaam } from '../engine/srs'
import { useStaat, zetInstelling } from '../engine/opslag'
import { TALEN, type Taal } from '../i18n/talen'
import { useT } from '../i18n'
import { Cijfer, Kaart, Keuzerij, Schakelaar } from '../ui/kit'

/**
 * Het profiel en de instellingen van het kind.
 *
 * Alleen wat een kind zelf mag veranderen. Alles wat geld of privacy raakt --
 * het abonnement, meldingen, gegevens verwijderen -- zit achter de ouderpoort
 * en staat hier alleen als link naartoe.
 */
export function Jij() {
  const t = useT()
  const profiel = useStaat((s) => s.profiel)
  const xp = useStaat((s) => s.xp)
  const reeks = useStaat((s) => s.reeks)
  const besteReeks = useStaat((s) => s.besteReeks)
  const kaarten = useStaat((s) => s.kaarten)
  const lessen = useStaat((s) => s.lessen)
  const inst = useStaat((s) => s.instellingen)

  const vast = Object.values(kaarten).filter((k) => sterkteNaam(k.sterkte) === 'vast').length
  const lessenAf = Object.values(lessen).filter((l) => l.keren > 0).length

  return (
    <div className="blad blad--met-tabs">
      <div className="kolom kolom--wijd">
        <div className="midden kolom" style={{ alignItems: 'center' }}>
          <div className="plaat" aria-hidden style={{ fontSize: '2.2rem' }}>{profiel.avatar}</div>
          <h1>{profiel.naam || t.welkom.naamLeeg}</h1>
        </div>

        <div className="rij" style={{ gap: 'var(--ruimte-2)' }}>
          <Cijfer waarde={xp} label={t.profiel.xp} emoji="⭐" />
          <Cijfer waarde={reeks} label={t.profiel.reeks} emoji="🔥" />
          <Cijfer waarde={Object.keys(kaarten).length} label={t.profiel.geleerd} emoji="📘" />
        </div>
        <div className="rij" style={{ gap: 'var(--ruimte-2)' }}>
          <Cijfer waarde={vast} label={t.ouders.sterkWoorden} emoji="🔒" />
          <Cijfer waarde={lessenAf} label={t.profiel.lessenAf} emoji="✅" />
          <Cijfer waarde={besteReeks} label={t.profiel.besteReeks} emoji="🏅" />
        </div>

        <h2>{t.instellingen.kop}</h2>

        <Kaart>
          <div className="kolom kolom--wijd">
            <div className="kolom" style={{ gap: 'var(--ruimte-2)' }}>
              <strong>{t.instellingen.taal}</strong>
              <Keuzerij<Taal>
                label={t.instellingen.taal}
                waarde={inst.taal}
                opties={TALEN.map((l) => ({ id: l.code as Taal, label: l.naam }))}
                onKies={(code) => zetInstelling('taal', code)}
              />
            </div>

            <div className="kolom" style={{ gap: 'var(--ruimte-2)' }}>
              <strong>{t.instellingen.kleur}</strong>
              <div role="group" aria-label={t.instellingen.kleur} className="tegels">
                {ACCENTEN.map((a: Accent) => (
                  <button
                    key={a}
                    type="button"
                    className="tegel"
                    aria-pressed={inst.accent === a}
                    aria-label={t.instellingen.kleuren[ACCENTNAAM[a] as keyof typeof t.instellingen.kleuren]}
                    onClick={() => zetInstelling('accent', a)}
                    style={{
                      background: ACCENTKLEUR[a],
                      width: 48,
                      height: 48,
                      borderColor: inst.accent === a ? 'var(--inkt)' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="kolom" style={{ gap: 'var(--ruimte-2)' }}>
              <strong>{t.instellingen.thema}</strong>
              <Keuzerij
                label={t.instellingen.thema}
                waarde={inst.thema}
                opties={[
                  { id: 'systeem' as const, label: t.instellingen.themaSysteem },
                  { id: 'licht' as const, label: t.instellingen.themaLicht },
                  { id: 'donker' as const, label: t.instellingen.themaDonker },
                ]}
                onKies={(id) => zetInstelling('thema', id)}
              />
            </div>

            <Schakelaar
              label={t.instellingen.geluid}
              aan={inst.geluid}
              onAan={(v) => zetInstelling('geluid', v)}
            />
            <Schakelaar
              label={t.instellingen.spreken}
              uitleg={t.instellingen.sprekenUitleg}
              aan={inst.spreken}
              onAan={(v) => zetInstelling('spreken', v)}
            />
            <Schakelaar
              label={t.instellingen.typen}
              aan={inst.typen}
              onAan={(v) => zetInstelling('typen', v)}
            />
            <Schakelaar
              label={t.instellingen.beweging}
              aan={inst.beweging === 'rustig'}
              onAan={(v) => zetInstelling('beweging', v ? 'rustig' : 'vol')}
            />
            <Schakelaar
              label={t.instellingen.lezen}
              aan={inst.lezen === 'dyslexie'}
              onAan={(v) => zetInstelling('lezen', v ? 'dyslexie' : 'gewoon')}
            />
          </div>
        </Kaart>

        <Link to="/ouders" className="knop knop--stil knop--breed">
          👪 {t.profiel.naarOuders}
        </Link>
      </div>
    </div>
  )
}
