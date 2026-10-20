import { useState } from 'react'
import { useT, vul } from '../i18n'
import { TALEN, type Taal } from '../i18n/talen'
import type { Leeftijdsgroep } from '../content/types'
import { zetInstelling, zetProfiel, zetStaat } from '../engine/opslag'
import { Kaart, Knop, Kop, Tr } from '../ui/kit'
import { Merkteken } from '../merk/Merkteken'

/**
 * Het welkomstscherm: vijf stappen, en de ouder komt als tweede.
 *
 * De volgorde is niet willekeurig. Taal eerst, want zonder taal is de rest
 * onleesbaar. Dan de ouder, vóórdat het kind zijn naam intikt -- een ouder die
 * pas achteraf leest wat de app opslaat, heeft geen keuze gehad. Daarna het
 * kind: naam, plaatje, leeftijd.
 *
 * Geen van de vijf stappen vraagt iets wat de app niet nodig heeft. Geen
 * geboortedatum, geen e-mailadres, geen achternaam. Zie
 * docs/privacy-and-safety.md.
 */

const AVATARS = ['🦢', '🦊', '🐈', '🦉', '🐝', '🌙', '⭐', '🫖', '🌻', '⚽'] as const

type Stap = 'taal' | 'ouder' | 'naam' | 'avatar' | 'groep' | 'gereed'

export function Welkom({ onKlaar }: { onKlaar: () => void }) {
  const t = useT()
  const [stap, zetStap] = useState<Stap>('taal')
  const [naam, zetNaam] = useState('')
  const [avatar, zetAvatar] = useState<string>(AVATARS[0])
  const [groep, zetGroep] = useState<Leeftijdsgroep>('midden')

  const rond = () => {
    zetProfiel({ naam: naam.trim().slice(0, 24), avatar, groep })
    // De leeftijdsgroep schakelt de oefenvormen. In `klein` staan typen en
    // spreken uit: een kind van vijf typt geen ş, en de spreekoefening is
    // daar een drempel in plaats van een oefening.
    if (groep === 'klein') {
      zetInstelling('typen', false)
      zetInstelling('spreken', false)
    }
    zetStaat({ welkomGedaan: true, ouderGezien: true })
    onKlaar()
  }

  return (
    <div className="blad">
      <div className="kolom kolom--wijd">
        {stap === 'taal' ? (
          <>
            <div className="midden kolom" style={{ alignItems: 'center', gap: 'var(--ruimte-2)' }}>
              <span style={{ color: 'var(--accent)' }}><Merkteken grootte={64} /></span>
              <h1><Tr>{t.welkom.titel.replace('{naam}', 'Dilimiz')}</Tr></h1>
              <p className="zacht" style={{ margin: 0 }}>{t.welkom.betekenis}</p>
              <p style={{ margin: 0 }}>{t.welkom.belofte}</p>
            </div>
            <Kop niveau="h2" onder={t.welkom.taalUitleg}>{t.welkom.kiesTaal}</Kop>
            <div className="kolom">
              {TALEN.map((taal) => (
                <button
                  key={taal.code}
                  type="button"
                  className="keuze"
                  onClick={() => { zetInstelling('taal', taal.code as Taal); zetStap('ouder') }}
                >
                  <span className="kolom" style={{ gap: 0 }}>
                    <strong>{taal.naam}</strong>
                    <span className="zacht klein">{taal.waar}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {stap === 'ouder' ? (
          <>
            <Kop onder={t.welkom.ouderIntro}>{t.welkom.ouderKop}</Kop>
            <Kaart>
              <div className="kolom">
                <div className="rij" style={{ alignItems: 'flex-start' }}>
                  <span aria-hidden style={{ fontSize: '1.4rem' }}>🔒</span>
                  <p style={{ margin: 0 }}>{t.welkom.ouderPrivacy}</p>
                </div>
                <div className="rij" style={{ alignItems: 'flex-start' }}>
                  <span aria-hidden style={{ fontSize: '1.4rem' }}>💳</span>
                  <p style={{ margin: 0 }}>{t.welkom.ouderBetalen}</p>
                </div>
              </div>
            </Kaart>
            {/*
              De waarschuwing over de lesinhoud hoort hier en niet alleen op
              het ouderoverzicht: een ouder die betaalt voor een cursus Turks
              moet vóór de eerste les weten dat de inhoud nog niet door een
              moedertaalspreker is nagekeken.
            */}
            <Kaart in>
              <p className="klein" style={{ margin: 0 }}>⚠ {t.ouders.inhoudNogNiet}</p>
            </Kaart>
            <Knop breed onClick={() => zetStap('naam')}>{t.welkom.ouderGelezen}</Knop>
          </>
        ) : null}

        {stap === 'naam' ? (
          <>
            <Kop onder={t.welkom.naamUitleg}>{t.welkom.naamKop}</Kop>
            <input
              className="invoer"
              type="text"
              autoComplete="off"
              maxLength={24}
              placeholder={t.welkom.naamPlaceholder}
              value={naam}
              onChange={(e) => zetNaam(e.target.value)}
              aria-label={t.welkom.naamKop}
            />
            <Knop breed onClick={() => zetStap('avatar')}>{t.algemeen.verder}</Knop>
            <Knop soort="stil" breed onClick={() => { zetNaam(''); zetStap('avatar') }}>
              {t.welkom.naamOverslaan}
            </Knop>
          </>
        ) : null}

        {stap === 'avatar' ? (
          <>
            <Kop>{t.welkom.avatarKop}</Kop>
            <div className="tegels" role="group" aria-label={t.welkom.avatarKop}>
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="tegel"
                  aria-pressed={avatar === a}
                  aria-label={a}
                  style={{ fontSize: '1.8rem', ...(avatar === a ? { borderColor: 'var(--accent)' } : {}) }}
                  onClick={() => zetAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
            <Knop breed onClick={() => zetStap('groep')}>{t.algemeen.verder}</Knop>
          </>
        ) : null}

        {stap === 'groep' ? (
          <>
            <Kop onder={t.welkom.groepUitleg}>{t.welkom.groepKop}</Kop>
            <div className="kolom">
              {([
                ['klein', t.welkom.groepKlein],
                ['midden', t.welkom.groepMidden],
                ['groot', t.welkom.groepGroot],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className="keuze"
                  aria-pressed={groep === id}
                  onClick={() => zetGroep(id)}
                >
                  <strong>{label}</strong>
                </button>
              ))}
            </div>
            <Knop breed onClick={() => zetStap('gereed')}>{t.algemeen.verder}</Knop>
          </>
        ) : null}

        {stap === 'gereed' ? (
          <>
            <div className="midden kolom" style={{ alignItems: 'center' }}>
              <div className="plaat" aria-hidden style={{ fontSize: '2.4rem' }}>{avatar}</div>
              <h1>{naam.trim() || t.welkom.naamLeeg}</h1>
            </div>
            <Kaart>
              <p style={{ margin: 0 }}>{t.welkom.gereedUitleg}</p>
            </Kaart>
            <p className="zacht klein midden" style={{ margin: 0 }}>{t.welkom.vooriedereen}</p>
            <Knop breed onClick={rond}>{vul(t.algemeen.start)}</Knop>
          </>
        ) : null}
      </div>
    </div>
  )
}
