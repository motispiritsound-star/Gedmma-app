import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  alsBestand, alsTekst, useStaat, wisAlles, zetInstelling, zetTerug,
} from '../engine/opslag'
import { sterkteNaam } from '../engine/srs'
import { inhoudNagekeken } from '../content/nakijken'
import { OPNAMES } from '../engine/audio'
import { MERK } from '../merk/merk'
import { useT } from '../i18n'
import { Cijfer, Kaart, Knop, Kop, Melding, Schakelaar, Vouw } from '../ui/kit'
import { Ouderpoort } from '../ui/Ouderpoort'

/**
 * Het ouderoverzicht, achter de ouderpoort.
 *
 * Drie dingen, in deze volgorde: hoe het met het kind gaat, wat de app
 * opslaat en niet doet, en de drie knoppen voor inzage, meenemen en
 * verwijderen. Die laatste drie zijn een AVG-eis én een winkeleis, maar vooral
 * zijn ze het antwoord op de vraag die een ouder werkelijk stelt: wat weet
 * deze app over mijn kind?
 *
 * Omdat er geen server is, is er geen inzageverzoek dat iemand moet
 * behandelen: de ouder ziet alles zelf, nu, zonder tussenkomst. Dat is de
 * reden dat deze opzet gekozen is.
 */
export function Ouders() {
  return (
    <div className="blad blad--met-tabs">
      <Ouderpoort>
        <OuderBlad />
      </Ouderpoort>
    </div>
  )
}

function OuderBlad() {
  const t = useT()
  const kaarten = useStaat((s) => s.kaarten)
  const lessen = useStaat((s) => s.lessen)
  const reeks = useStaat((s) => s.reeks)
  const inst = useStaat((s) => s.instellingen)
  const abonnement = useStaat((s) => s.abonnement)

  const [melding, zetMelding] = useState<string | null>(null)
  const bestandKiezer = useRef<HTMLInputElement>(null)

  const vast = Object.values(kaarten).filter((k) => sterkteNaam(k.sterkte) === 'vast').length
  const lessenAf = Object.values(lessen).filter((l) => l.keren > 0).length
  const nogNiets = lessenAf === 0 && Object.keys(kaarten).length === 0

  const neemMee = () => {
    // Downloaden via een blob-adres: geen server, geen upload, en het bestand
    // komt in de downloadmap van het toestel.
    const adres = URL.createObjectURL(alsBestand())
    const link = document.createElement('a')
    link.href = adres
    link.download = `${MERK.opslagSleutel}.json`
    link.click()
    URL.revokeObjectURL(adres)
  }

  const lees = (bestand: File) => {
    const lezer = new FileReader()
    lezer.onload = () => {
      const gelukt = zetTerug(String(lezer.result))
      zetMelding(gelukt ? t.ouders.terugzettenGelukt : t.ouders.terugzettenMislukt)
    }
    lezer.readAsText(bestand)
  }

  const verwijder = () => {
    if (!confirm(`${t.ouders.verwijderenZeker}\n\n${t.ouders.verwijderenNietAbonnement}`)) return
    wisAlles()
    zetMelding(t.ouders.verwijderd)
  }

  return (
    <div className="kolom kolom--wijd">
      <Kop onder={t.ouders.intro}>{t.ouders.kop}</Kop>
      {melding ? <Melding tekst={melding} soort="goed" /> : null}

      {/* -- hoe gaat het ------------------------------------------------- */}
      <section className="kolom">
        <h2>{t.ouders.voortgangKop}</h2>
        {nogNiets ? (
          <p className="zacht">{t.ouders.voortgangLeeg}</p>
        ) : (
          <>
            <div className="rij" style={{ gap: 'var(--ruimte-2)' }}>
              <Cijfer waarde={Object.keys(kaarten).length} label={t.ouders.woordenGeleerd} />
              <Cijfer waarde={vast} label={t.ouders.sterkWoorden} />
            </div>
            <div className="rij" style={{ gap: 'var(--ruimte-2)' }}>
              <Cijfer waarde={lessenAf} label={t.ouders.lessenAf} />
              <Cijfer waarde={reeks} label={t.ouders.dagenOpRij} />
            </div>
          </>
        )}
      </section>

      {/* -- eerlijk over de stand van het product ------------------------ */}
      {!inhoudNagekeken() ? (
        <Kaart in>
          <p className="klein" style={{ margin: 0 }}>
            <strong>{t.ouders.inhoudKop}</strong><br />⚠ {t.ouders.inhoudNogNiet}
          </p>
        </Kaart>
      ) : null}

      {OPNAMES.size === 0 ? (
        <Kaart in>
          <p className="klein" style={{ margin: 0 }}>
            <strong>{t.ouders.audioKop}</strong><br />{t.ouders.audioComputerstem}
          </p>
        </Kaart>
      ) : null}

      {/* -- privacy ------------------------------------------------------ */}
      <section className="kolom">
        <h2>{t.ouders.privacyKop}</h2>
        <Kaart>
          <div className="kolom">
            <p style={{ margin: 0 }}>{t.ouders.privacyKort}</p>
            <p className="klein zacht" style={{ margin: 0 }}>🚫 {t.ouders.privacyGeenAds}</p>
            <p className="klein zacht" style={{ margin: 0 }}>🎙 {t.ouders.privacyGeenOpname}</p>
          </div>
        </Kaart>
      </section>

      {/* -- de gegevens -------------------------------------------------- */}
      <section className="kolom">
        <h2>{t.ouders.gegevensKop}</h2>

        <Vouw titel={`${t.ouders.bekijken} — ${t.ouders.bekijkenUitleg}`}>
          {/*
            Letterlijk alles, en geen samenvatting. Een ouder die wil weten wat
            de app bewaart, hoort het te zien en niet te moeten vertrouwen.
          */}
          <pre
            className="klein"
            style={{
              margin: 0, maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', background: 'var(--papier-in)',
              padding: 'var(--ruimte-3)', borderRadius: 'var(--rond-m)',
            }}
          >
            {alsTekst()}
          </pre>
        </Vouw>

        <Kaart>
          <div className="kolom">
            <Knop soort="stil" breed onClick={neemMee}>⬇ {t.ouders.meenemen}</Knop>
            <p className="zacht klein" style={{ margin: 0 }}>{t.ouders.meenemenUitleg}</p>

            <Knop soort="stil" breed onClick={() => bestandKiezer.current?.click()}>
              ⬆ {t.ouders.terugzetten}
            </Knop>
            <p className="zacht klein" style={{ margin: 0 }}>{t.ouders.terugzettenUitleg}</p>
            <input
              ref={bestandKiezer}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) lees(f) }}
            />

            <Knop soort="nogeens" breed onClick={verwijder}>🗑 {t.ouders.verwijderen}</Knop>
            <p className="zacht klein" style={{ margin: 0 }}>
              {t.ouders.verwijderenUitleg} {t.ouders.verwijderenNietAbonnement}
            </p>
          </div>
        </Kaart>
      </section>

      {/* -- meldingen ---------------------------------------------------- */}
      <section className="kolom">
        <h2>{t.ouders.herinneringKop}</h2>
        <Kaart>
          <div className="kolom">
            <Schakelaar
              label={t.ouders.herinneringKop}
              uitleg={t.ouders.herinneringUitleg}
              aan={inst.herinnering}
              onAan={(v) => zetInstelling('herinnering', v)}
            />
            {inst.herinnering ? (
              <label className="rij rij--tussen">
                <span>{t.ouders.herinneringTijd}</span>
                <input
                  type="time"
                  className="invoer"
                  style={{ width: 130, fontFamily: 'var(--font-tekst)' }}
                  value={inst.herinneringTijd}
                  onChange={(e) => zetInstelling('herinneringTijd', e.target.value)}
                />
              </label>
            ) : null}
          </div>
        </Kaart>
      </section>

      {/* -- abonnement --------------------------------------------------- */}
      <section className="kolom">
        <h2>{t.abonnement.kop}</h2>
        {abonnement.actief ? (
          <Kaart in><p className="klein" style={{ margin: 0 }}>✓ {t.abonnement.actief}</p></Kaart>
        ) : null}
        <Link to="/abonnement" className="knop knop--stil knop--breed">{t.abonnement.kop}</Link>
      </section>
    </div>
  )
}
