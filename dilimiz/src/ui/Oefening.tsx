import { useEffect, useRef, useState } from 'react'
import type { Oefening as OefeningVorm } from '../engine/oefeningen'
import { plakOefening } from '../engine/oefeningen'
import { woord } from '../content/woorden'
import { LETTER } from '../content/letters'
import { KLANKPAAR } from '../content/klankparen'
import { tegelsVan, zin } from '../content/zinnen'
import { harmonieOefening } from '../content/achtervoegsels'
import { gelijk, HULPTOETSEN } from '../engine/turks'
import { heeftEchteOpname, speel, stilte } from '../engine/audio'
import { useT, useTaal } from '../i18n'
import { Kaart, Knop, Lint, Tr, Uitleg } from './kit'

/**
 * Eén oefening op het scherm.
 *
 * Alle vormen in één bestand, want ze delen hetzelfde geraamte: een vraag, een
 * antwoord, en een uitkomst. Uit elkaar trekken per vorm leverde bij de vorige
 * app veertien bestanden op die allemaal hetzelfde randwerk herhaalden.
 *
 * Het geeft aan de ouder hierboven alleen dóór of het goed was. De planner,
 * de XP en de voortgang zitten niet hier.
 */

export type Uitkomst = 'goed' | 'fout'

interface Props {
  oefening: OefeningVorm
  onKlaar: (uitkomst: Uitkomst) => void
}

/* ---------------------------------------------------------- de luisterknop */

function Luister({ id, tekst, groot }: { id: string; tekst: string; groot?: boolean }) {
  const t = useT()
  const [gespeeld, zetGespeeld] = useState<'opname' | 'synthese' | null>(null)
  const synthese = gespeeld === 'synthese'

  const speelAf = (traag = false) => zetGespeeld(speel(id, tekst, { traag }))

  // Eén keer bij het verschijnen, want dat is waar de oefening om vraagt.
  useEffect(() => { speelAf() }, [id])
  useEffect(() => stilte, [])

  return (
    <div className="kolom" style={{ gap: 'var(--ruimte-2)', alignItems: 'center' }}>
      <Knop onClick={() => speelAf()} aria-label={t.les.hoorHet}>
        <span aria-hidden style={{ fontSize: groot ? '1.6rem' : '1.2rem' }}>🔊</span>
        {t.les.hoorHet}
      </Knop>
      <Knop soort="stil" klein onClick={() => speelAf(true)}>🐢 {t.les.nogEens}</Knop>
      {synthese && !heeftEchteOpname(id) ? (
        <span title={t.les.computerstemUitleg}>
          <Lint letOp>⚠ {t.les.computerstem}</Lint>
        </span>
      ) : null}
    </div>
  )
}

/* --------------------------------------------------------------- de vormen */

export function Oefening({ oefening, onKlaar }: Props) {
  const t = useT()
  const taal = useTaal()
  const [gekozen, zetGekozen] = useState<string | null>(null)
  const [nagekeken, zetNagekeken] = useState(false)
  const [getypt, zetGetypt] = useState('')
  const [gelegd, zetGelegd] = useState<string[]>([])
  const invoer = useRef<HTMLInputElement>(null)

  // Terug naar nul bij een volgende oefening. Zonder dit staat het antwoord
  // van de vorige vraag er nog.
  useEffect(() => {
    zetGekozen(null); zetNagekeken(false); zetGetypt(''); zetGelegd([])
  }, [oefening.id])

  const w = oefening.woordId ? woord(oefening.woordId) : undefined
  const letter = oefening.letterId ? LETTER(oefening.letterId) : undefined
  const paar = oefening.klankpaarId ? KLANKPAAR(oefening.klankpaarId) : undefined
  const z = oefening.zinId ? zin(oefening.zinId) : undefined

  const klaar = (uitkomst: Uitkomst) => { stilte(); onKlaar(uitkomst) }

  /* -- leerkaarten: altijd goed, alleen kennismaken ---------------------- */

  if (oefening.soort === 'nieuw' && w) {
    return (
      <div className="kolom kolom--wijd">
        <p className="zacht klein" style={{ margin: 0 }}>{t.les.nieuwWoord}</p>
        <Kaart>
          <div className="kolom midden" style={{ alignItems: 'center' }}>
            {w.emoji ? <div className="plaat" aria-hidden>{w.emoji}</div> : null}
            <Tr kop>{w.tr}</Tr>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>{w.betekenis[taal]}</p>
            {w.gebruik ? <p className="zacht klein" style={{ margin: 0 }}><Uitleg tekst={w.gebruik[taal]} /></p> : null}
            <Luister id={w.id} tekst={w.tr} groot />
          </div>
        </Kaart>
        <Knop breed onClick={() => klaar('goed')}>{t.les.volgende}</Knop>
      </div>
    )
  }

  if (oefening.soort === 'letter-nieuw' && letter) {
    return (
      <div className="kolom kolom--wijd">
        <p className="zacht klein" style={{ margin: 0 }}>{t.les.nieuweLetter}</p>
        <Kaart>
          <div className="kolom midden" style={{ alignItems: 'center' }}>
            <Tr kop>{letter.klein} {letter.hoofd}</Tr>
            <p className="zacht klein" style={{ margin: 0 }}>{t.alfabet.hoofdletter}: <Tr>{letter.hoofd}</Tr></p>
            <p style={{ fontSize: '1.05rem', margin: 0 }}>{t.alfabet.klinkt} <Uitleg tekst={letter.klank[taal]} /></p>
            {letter.voorbeeld ? (
              <p className="zacht klein" style={{ margin: 0 }}>{t.alfabet.voorbeeld}: <Tr>{letter.voorbeeld}</Tr></p>
            ) : null}
            {letter.voorbeeld ? <Luister id={`l-${letter.id}`} tekst={letter.voorbeeld} /> : null}
          </div>
        </Kaart>
        <Knop breed onClick={() => klaar('goed')}>{t.les.volgende}</Knop>
      </div>
    )
  }

  if (oefening.soort === 'zin-nieuw' && z) {
    return (
      <div className="kolom kolom--wijd">
        <p className="zacht klein" style={{ margin: 0 }}>{t.les.nieuweZin}</p>
        <Kaart>
          <div className="kolom midden" style={{ alignItems: 'center' }}>
            <Tr groot>{z.tr}</Tr>
            <p style={{ margin: 0 }}>{z.betekenis[taal]}</p>
            {z.hulpwoorden?.length ? (
              <div className="kaart kaart--in klein" style={{ padding: 'var(--ruimte-3)', width: '100%' }}>
                <p className="zacht" style={{ margin: '0 0 4px' }}>{t.les.hulpwoord}</p>
                {z.hulpwoorden.map((h) => (
                  <div key={h.tr} className="rij rij--tussen">
                    <Tr>{h.tr}</Tr><span className="zacht">{h.betekenis[taal]}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <Luister id={`z-${z.id}`} tekst={z.tr} groot />
          </div>
        </Kaart>
        <Knop breed onClick={() => klaar('goed')}>{t.les.volgende}</Knop>
      </div>
    )
  }

  /* -- keuzevormen ------------------------------------------------------- */

  if (oefening.keuzes && (oefening.soort === 'kies-betekenis' || oefening.soort === 'kies-turks' || oefening.soort === 'luister')) {
    const goed = oefening.woordId!
    const vraag = oefening.soort === 'kies-betekenis' ? t.les.watBetekent
      : oefening.soort === 'kies-turks' ? t.les.hoeZegJe
      : t.les.welkHoordeJe
    return (
      <Keuze
        vraag={vraag}
        boven={
          oefening.soort === 'kies-betekenis' ? <Tr groot>{w!.tr}</Tr>
          : oefening.soort === 'kies-turks' ? <span style={{ fontSize: '1.3rem' }}>{w!.betekenis[taal]}</span>
          : <Luister id={w!.id} tekst={w!.tr} groot />
        }
        keuzes={oefening.keuzes}
        goed={goed}
        gekozen={gekozen}
        nagekeken={nagekeken}
        label={(id) => {
          const k = woord(id)!
          return oefening.soort === 'kies-betekenis'
            ? <span>{k.emoji ? <span aria-hidden>{k.emoji} </span> : null}{k.betekenis[taal]}</span>
            : <Tr>{k.tr}</Tr>
        }}
        onKies={zetGekozen}
        onNakijk={() => zetNagekeken(true)}
        onKlaar={klaar}
      />
    )
  }

  if (oefening.keuzes && oefening.soort === 'letter-klank' && letter) {
    // "Welke letter is dit?" en niet "Welke hoorde je?": bij deze vorm staat
    // de klankbeschrijving op het scherm en klinkt er niets.
    return (
      <Keuze
        vraag={t.les.welkeLetter}
        boven={<p style={{ fontSize: '1.05rem', margin: 0 }}><Uitleg tekst={letter.klank[taal]} /></p>}
        keuzes={oefening.keuzes}
        goed={letter.id}
        gekozen={gekozen}
        nagekeken={nagekeken}
        label={(id) => <Tr groot>{LETTER(id)!.klein}</Tr>}
        onKies={zetGekozen}
        onNakijk={() => zetNagekeken(true)}
        onKlaar={klaar}
      />
    )
  }

  if (oefening.keuzes && oefening.soort === 'zin-betekenis' && z) {
    return (
      <Keuze
        vraag={t.les.watBetekent}
        boven={<Tr groot>{z.tr}</Tr>}
        keuzes={oefening.keuzes}
        goed={z.id}
        gekozen={gekozen}
        nagekeken={nagekeken}
        label={(id) => <span>{zin(id)!.betekenis[taal]}</span>}
        onKies={zetGekozen}
        onNakijk={() => zetNagekeken(true)}
        onKlaar={klaar}
      />
    )
  }

  /* -- klankpaar: de Turkse oefenvorm bij uitstek ------------------------ */

  if (oefening.soort === 'klankpaar' && paar) {
    const kant = oefening.kant ?? 'links'
    const juist = paar[kant]
    const keuzes = ['links', 'rechts'] as const
    return (
      <div className="kolom kolom--wijd">
        <p className="zacht klein" style={{ margin: 0 }}>{t.les.welkHoordeJe}</p>
        <Kaart>
          <div className="kolom midden" style={{ alignItems: 'center' }}>
            <Luister id={`p-${paar.id}-${kant}`} tekst={juist.tr} groot />
          </div>
        </Kaart>
        <div className="kolom">
          {keuzes.map((k) => {
            const optie = paar[k]
            const isGoed = k === kant
            const klassen = ['keuze']
            if (nagekeken && isGoed) klassen.push('keuze--goed')
            if (nagekeken && gekozen === k && !isGoed) klassen.push('keuze--fout')
            return (
              <button
                key={k}
                type="button"
                className={klassen.join(' ')}
                aria-pressed={gekozen === k}
                disabled={nagekeken}
                onClick={() => zetGekozen(k)}
              >
                <Tr groot>{optie.tr}</Tr>
                {nagekeken ? <span className="zacht klein">{optie.betekenis[taal]}</span> : null}
              </button>
            )
          })}
        </div>
        <Afronden
          nagekeken={nagekeken}
          kanNakijken={gekozen !== null}
          goed={gekozen === kant}
          antwoord={<Tr>{juist.tr}</Tr>}
          onNakijk={() => zetNagekeken(true)}
          onKlaar={klaar}
        />
      </div>
    )
  }

  /* -- harmonie: welk achtervoegsel past? -------------------------------- */

  if (oefening.soort === 'harmonie' && oefening.keuzes && oefening.regelId) {
    const regel = harmonieOefening(oefening.regelId)
    return (
      <div className="kolom kolom--wijd">
        <p className="zacht klein" style={{ margin: 0 }}>{t.les.kiesAchtervoegsel}</p>
        <Kaart>
          <div className="kolom midden" style={{ alignItems: 'center' }}>
            <Tr kop>{regel?.woord}</Tr>
            {regel ? <p className="zacht" style={{ margin: 0 }}>{regel.betekenis[taal]}</p> : null}
          </div>
        </Kaart>
        <div className="tegels">
          {oefening.keuzes.map((k) => {
            const isGoed = k === oefening.antwoord
            const klassen = ['tegel']
            if (gekozen === k && !nagekeken) klassen.push('tegel--gekozen')
            return (
              <button
                key={k}
                type="button"
                className={klassen.join(' ')}
                aria-pressed={gekozen === k}
                disabled={nagekeken}
                style={nagekeken && isGoed ? { borderColor: 'var(--fistik-500)' }
                  : nagekeken && gekozen === k ? { borderColor: 'var(--gul-500)' } : undefined}
                onClick={() => zetGekozen(k)}
              >
                <Tr>{k}</Tr>
              </button>
            )
          })}
        </div>
        <Afronden
          nagekeken={nagekeken}
          kanNakijken={gekozen !== null}
          goed={gekozen === oefening.antwoord}
          antwoord={<Tr>{oefening.antwoord}</Tr>}
          onNakijk={() => zetNagekeken(true)}
          onKlaar={klaar}
        />
      </div>
    )
  }

  /* -- plak: een woord dat groeit ---------------------------------------- */

  if (oefening.soort === 'plak' && oefening.tegels && oefening.regelId) {
    const regel = plakOefening(oefening.regelId)
    const zover = (regel?.stam ?? '') + gelegd.join('')
    const stap = regel?.stappen.find((s) => s.heel === zover)
    return (
      <div className="kolom kolom--wijd">
        <p className="zacht klein" style={{ margin: 0 }}>{t.les.plakHetAan}</p>
        <Kaart>
          <div className="kolom midden" style={{ alignItems: 'center' }}>
            <Tr groot>{zover}</Tr>
            <p className="zacht klein" style={{ margin: 0, minHeight: '1.4em' }}>
              {stap ? stap.betekenis[taal] : ''}
            </p>
          </div>
        </Kaart>
        <div className="tegels">
          {oefening.tegels.map((deel, i) => (
            <button
              key={`${deel}-${i}`}
              type="button"
              className={`tegel${gelegd.includes(deel) ? ' tegel--leeg' : ''}`}
              disabled={nagekeken || gelegd.includes(deel)}
              onClick={() => zetGelegd([...gelegd, deel])}
            >
              <Tr>-{deel}</Tr>
            </button>
          ))}
        </div>
        {gelegd.length ? (
          <Knop soort="stil" klein onClick={() => zetGelegd(gelegd.slice(0, -1))}>↩ {t.algemeen.terug}</Knop>
        ) : null}
        <Afronden
          nagekeken={nagekeken}
          kanNakijken={gelegd.length > 0}
          goed={zover === oefening.antwoord}
          antwoord={<Tr>{oefening.antwoord}</Tr>}
          onNakijk={() => zetNagekeken(true)}
          onKlaar={klaar}
        />
      </div>
    )
  }

  /* -- zin bouwen uit tegels -------------------------------------------- */

  if (oefening.soort === 'zin-bouw' && oefening.tegels && z) {
    const juist = tegelsVan(z.tr)
    const goed = gelegd.length === juist.length && gelegd.every((v, i) => v === juist[i])
    return (
      <div className="kolom kolom--wijd">
        <p className="zacht klein" style={{ margin: 0 }}>{t.les.bouwDeZin}</p>
        <Kaart in>
          <p style={{ margin: 0, fontSize: '1.05rem' }}>{z.betekenis[taal]}</p>
        </Kaart>
        <div className="kaart" style={{ minHeight: 72 }}>
          <div className="tegels">
            {gelegd.map((deel, i) => (
              <button
                key={`${deel}-${i}`}
                type="button"
                className="tegel tegel--gekozen"
                disabled={nagekeken}
                onClick={() => zetGelegd(gelegd.filter((_, j) => j !== i))}
              >
                <Tr>{deel}</Tr>
              </button>
            ))}
          </div>
        </div>
        <div className="tegels">
          {oefening.tegels.map((deel, i) => {
            // Een tegel kan twee keer in een zin voorkomen (`iyi geceler anne,
            // iyi geceler baba`), dus tellen en niet alleen kijken of hij er
            // al ligt.
            const gebruikt = gelegd.filter((g) => g === deel).length
            const beschikbaar = oefening.tegels!.filter((x) => x === deel).length
            const alGebruikt = gebruikt >= beschikbaar
            return (
              <button
                key={`${deel}-${i}`}
                type="button"
                className={`tegel${alGebruikt ? ' tegel--leeg' : ''}`}
                disabled={nagekeken || alGebruikt}
                onClick={() => zetGelegd([...gelegd, deel])}
              >
                <Tr>{deel}</Tr>
              </button>
            )
          })}
        </div>
        <Afronden
          nagekeken={nagekeken}
          kanNakijken={gelegd.length > 0}
          goed={goed}
          antwoord={<Tr>{z.tr}</Tr>}
          onNakijk={() => zetNagekeken(true)}
          onKlaar={klaar}
        />
      </div>
    )
  }

  /* -- typen, met de hulprij -------------------------------------------- */

  if (oefening.soort === 'tik' && w) {
    const goed = gelijk(getypt, w.tr)
    const voegToe = (teken: string) => {
      zetGetypt(getypt + teken)
      invoer.current?.focus()
    }
    return (
      <div className="kolom kolom--wijd">
        <p className="zacht klein" style={{ margin: 0 }}>{t.les.typHet}</p>
        <Kaart in>
          <div className="rij" style={{ gap: 'var(--ruimte-3)' }}>
            {w.emoji ? <span aria-hidden style={{ fontSize: '1.6rem' }}>{w.emoji}</span> : null}
            <span style={{ fontSize: '1.15rem' }}>{w.betekenis[taal]}</span>
          </div>
        </Kaart>
        <input
          ref={invoer}
          className="invoer"
          lang="tr"
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={getypt}
          disabled={nagekeken}
          onChange={(e) => zetGetypt(e.target.value)}
          aria-label={t.les.typHet}
        />
        {/*
          De hulprij. Een Nederlands, Duits of Frans toetsenbord geeft geen ğ,
          ı, İ of ş, en zonder deze rij is de tikoefening niet te doen -- juist
          bij de woorden waar de app over gaat.
        */}
        <div className="hulptoetsen">
          {HULPTOETSEN.map((teken) => (
            <button
              key={teken}
              type="button"
              className="hulptoets"
              disabled={nagekeken}
              onClick={() => voegToe(teken)}
              aria-label={teken}
            >
              {teken}
            </button>
          ))}
        </div>
        <Afronden
          nagekeken={nagekeken}
          kanNakijken={getypt.trim().length > 0}
          goed={goed}
          antwoord={<Tr>{w.tr}</Tr>}
          onNakijk={() => zetNagekeken(true)}
          onKlaar={klaar}
        />
      </div>
    )
  }

  /* -- spreken: geen score, zie docs/decisions.md P-3 -------------------- */

  if (oefening.soort === 'spreek' && w) {
    return (
      <div className="kolom kolom--wijd">
        <p className="zacht klein" style={{ margin: 0 }}>{t.les.zegHet}</p>
        <Kaart>
          <div className="kolom midden" style={{ alignItems: 'center' }}>
            <Tr kop>{w.tr}</Tr>
            <p style={{ margin: 0 }}>{w.betekenis[taal]}</p>
            <Luister id={w.id} tekst={w.tr} groot />
          </div>
        </Kaart>
        <p className="zacht klein midden" style={{ margin: 0 }}>{t.les.zegHetUitleg}</p>
        {/*
          De microfoon zit hier nog niet in. Zie docs/mvp-backlog.md #23: de
          oefening staat er, de opname nog niet -- en er wordt niets
          opgeslagen en niets verstuurd als die er komt.
        */}
        <Knop breed onClick={() => klaar('goed')}>{t.algemeen.klaar}</Knop>
      </div>
    )
  }

  // Een vorm die er niet is. Hoort niet te gebeuren -- de generator maakt
  // alleen wat hierboven staat -- maar een kind hoort geen wit scherm te zien
  // als het wel gebeurt.
  return <Knop breed onClick={() => klaar('goed')}>{t.les.volgende}</Knop>
}

/* ---------------------------------------------------------- gedeelde delen */

function Keuze({
  vraag, boven, keuzes, goed, gekozen, nagekeken, label, onKies, onNakijk, onKlaar,
}: {
  vraag: string
  boven: React.ReactNode
  keuzes: string[]
  goed: string
  gekozen: string | null
  nagekeken: boolean
  label: (id: string) => React.ReactNode
  onKies: (id: string) => void
  onNakijk: () => void
  onKlaar: (u: Uitkomst) => void
}) {
  return (
    <div className="kolom kolom--wijd">
      <p className="zacht klein" style={{ margin: 0 }}>{vraag}</p>
      <Kaart>
        <div className="kolom midden" style={{ alignItems: 'center' }}>{boven}</div>
      </Kaart>
      <div className="kolom">
        {keuzes.map((id) => {
          const klassen = ['keuze']
          if (nagekeken && id === goed) klassen.push('keuze--goed')
          if (nagekeken && id === gekozen && id !== goed) klassen.push('keuze--fout')
          return (
            <button
              key={id}
              type="button"
              className={klassen.join(' ')}
              aria-pressed={gekozen === id}
              disabled={nagekeken}
              onClick={() => onKies(id)}
            >
              {label(id)}
            </button>
          )
        })}
      </div>
      <Afronden
        nagekeken={nagekeken}
        kanNakijken={gekozen !== null}
        goed={gekozen === goed}
        antwoord={label(goed)}
        onNakijk={onNakijk}
        onKlaar={onKlaar}
      />
    </div>
  )
}

/**
 * De onderkant: nakijken, en daarna de uitkomst met het goede antwoord.
 *
 * Het goede antwoord staat er ook als het fout was, en zonder scherpe woorden:
 * `Het is: …`, niet `Fout!`. Een kinderapp hoort geen rood te knipperen bij
 * een vergissing -- zie docs/privacy-and-safety.md §Geen druk.
 */
function Afronden({ nagekeken, kanNakijken, goed, antwoord, onNakijk, onKlaar }: {
  nagekeken: boolean
  kanNakijken: boolean
  goed: boolean
  antwoord: React.ReactNode
  onNakijk: () => void
  onKlaar: (u: Uitkomst) => void
}) {
  const t = useT()
  if (!nagekeken) {
    return <Knop breed disabled={!kanNakijken} onClick={onNakijk}>{t.les.nakijken}</Knop>
  }
  return (
    <div className="kolom" role="status">
      <Kaart in>
        <strong style={{ color: goed ? 'var(--fistik-600)' : 'var(--inkt)' }}>
          {goed ? `✓ ${t.les.goed}` : t.les.fout}
        </strong>
        {goed ? null : <div style={{ marginTop: 6 }}>{antwoord}</div>}
      </Kaart>
      <Knop
        breed
        soort={goed ? 'goed' : 'nogeens'}
        onClick={() => onKlaar(goed ? 'goed' : 'fout')}
      >
        {t.les.volgende}
      </Knop>
    </div>
  )
}
