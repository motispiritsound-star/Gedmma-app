import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  exportProgress, importProgress, resetProgress, setSetting, setState, useStore, type Settings,
} from '../engine/store'
import {
  arabicVoices, bruikbareStemmen, canListen, canNarrate, canSpeak, prepareSamples, probeSound, say, sfx, voicePlan,
  type SoundProbe,
} from '../engine/audio'
import { LIST_PRICE, TRIAL_DAYS } from '../engine/billing'
import { gezinsdeling } from '../engine/platform'
import { LANGS, localeOf, useT, type Lang } from '../i18n'
import { useVoices } from '../ui/useVoices'
import { Button, Card, SectionTitle, Sheet } from '../ui/kit'
import { kanTrillen } from '../engine/trilling'
import { kanHerinneren, zetHerinnering } from '../engine/herinnering'
import { FeedbackButton } from '../ui/Feedback'

/** The embedded demo runs in a sandbox where a page cannot hand over a file. */
const DEMO = import.meta.env.VITE_DEMO === '1'

function Row({ title, hint, children }: { title: string; hint?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] p-4 last:border-0">
      <div className="min-w-40 flex-1">
        <div className="font-display font-extrabold">{title}</div>
        {hint && <div className="text-sm text-[var(--ink-soft)]">{hint}</div>}
      </div>
      {children && <div className="ms-auto max-w-full">{children}</div>}
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => { sfx.toggle(!on); onChange(!on) }}
      className={`h-8 w-14 rounded-full border-2 p-0.5 transition ${on ? 'border-mint-600 bg-mint-500' : 'border-[var(--line)] bg-[var(--surface-sunken)]'}`}
    >
      <span className={`block h-6 w-6 rounded-full bg-white shadow transition ${on ? 'translate-x-6' : ''}`} />
    </button>
  )
}

/**
 * The sound check: plays a sound both ways and says what came out.
 *
 * "I hear nothing" is the one report that cannot be read off the code, because
 * the app, the browser, the phone's mute switch and the speaker are four
 * different places a sound can die. So rather than guess, this measures: if
 * the level is above zero the app is making sound and something past it is
 * swallowing it, and if it is zero the fault is ours.
 */
function SoundCheck() {
  const t = useT()
  const [probe, setProbe] = useState<SoundProbe | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      setProbe(await probeSound())
    } finally {
      setBusy(false)
    }
  }

  const heard = probe && (probe.level > 0.02 || probe.media)
  const verdict = !probe
    ? t.settings.checkNiets
    : probe.mixer === 'geen' && !probe.media
      ? t.settings.mixerGeen
      : heard
        ? t.settings.checkGoed(probe.level.toFixed(2))
        : t.settings.checkStil

  return (
    <div className="border-b border-[var(--line)] p-4 last:border-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-display font-extrabold">{t.settings.geluidscheck}</div>
        {/* Muted: the measurement should be of the probe's own sound, not of
            the probe's sound plus this button's. */}
        <Button
          variant={heard ? 'secondary' : 'primary'}
          mute
          disabled={busy}
          className="ms-auto"
          onClick={() => void run()}
        >
          {busy ? t.settings.checkBezig : t.settings.checkKnop}
        </Button>
      </div>

      <p className="mt-2 text-sm text-[var(--ink-soft)]">{verdict}</p>
      {probe ? (
        <p className="mt-1 text-xs font-bold text-[var(--ink-soft)]">
          {t.settings.checkRegel(
            probe.level.toFixed(2),
            probe.media ? t.settings.checkMedia : t.settings.checkGeenMedia,
          )}
        </p>
      ) : (
        <p className="mt-1 text-xs text-[var(--ink-soft)]">{t.settings.mixerStil}</p>
      )}
    </div>
  )
}

function Choice<T extends string | number>({ value, options, onChange }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl bg-[var(--surface-sunken)] p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => { sfx.nav(); onChange(o.value) }}
          className={`rounded-xl px-3 py-1.5 text-sm font-bold ${value === o.value ? 'bg-[var(--surface-raised)] shadow' : 'text-[var(--ink-soft)]'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SettingsPage() {
  const t = useT()
  const state = useStore((s) => s)
  const s = state.settings
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => setSetting(k, v)
  const [confirmReset, setConfirmReset] = useState(false)
  const [imported, setImported] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  const all = useVoices()
  const arabic = arabicVoices()
  const bruikbaar = bruikbareStemmen()
  const plan = voicePlan()
  const voiceStatus =
    plan.mode === 'arabisch' ? t.settings.stemInGebruik(plan.voice.name, plan.voice.lang)
    : plan.mode === 'benadering' ? t.settings.stemBenadering(plan.voice.name)
    : canSpeak() ? t.settings.stemGeen
    : t.settings.stemOnmogelijk

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `darijaforkids-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SectionTitle sub={t.settings.uitleg}>{t.settings.titel}</SectionTitle>

      <Card className="mb-6">
        <Row title={t.settings.taal} hint={t.settings.taalHint}>
          <div className="flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { sfx.nav(); setSetting('lang', l.code as Lang) }}
                className={`rounded-xl border-2 px-3 py-2 text-sm font-bold ${s.lang === l.code ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'}`}
              >
                <span className="font-display font-extrabold" aria-hidden="true">{l.badge}</span> {l.name}
              </button>
            ))}
          </div>
        </Row>
        <Row title={t.settings.naam} hint={t.settings.naamHint}>
          <input
            id="name"
            value={state.name}
            onChange={(e) => setState({ name: e.target.value.slice(0, 24) })}
            placeholder={t.settings.naamPlaceholder}
            className="w-40 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 outline-none focus:border-zellige-500"
          />
        </Row>
        <Row title={t.settings.dagdoel} hint={t.settings.dagdoelHint}>
          <Choice
            value={s.dailyGoal}
            onChange={set('dailyGoal')}
            options={[15, 30, 50, 80].map((v, i) => ({ value: v, label: t.settings.dagdoelOpties[i]! }))}
          />
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">{t.unlock.titel}</h2>
      <Card className="mb-6">
        <Row
          title={t.unlock.titel}
          hint={state.unlocked ? t.unlock.alOpen : t.unlock.sub(TRIAL_DAYS, LIST_PRICE, gezinsdeling())}
        >
          <Link to="/volledig">
            <Button variant={state.unlocked ? 'secondary' : 'primary'}>
              {state.unlocked ? t.unlock.beheer : t.unlock.koop(TRIAL_DAYS)}
            </Button>
          </Link>
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">{t.settings.lezenTitel}</h2>
      <Card className="mb-6">
        <Row title={t.settings.schrift} hint={t.settings.schriftHint}>
          <Toggle on={s.showScript} onChange={set('showScript')} label={t.settings.schrift} />
        </Row>
        <Row title={t.settings.latijn} hint={t.settings.latijnHint}>
          <Toggle on={s.showTranslit} onChange={set('showTranslit')} label={t.settings.latijn} />
        </Row>
        <Row title={t.settings.lettertype} hint={t.settings.lettertypeHint}>
          <Choice
            value={s.reading}
            onChange={set('reading')}
            options={[{ value: 'normal', label: t.settings.normaal }, { value: 'dyslexia', label: t.settings.dyslexie }]}
          />
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">{t.settings.geluidTitel}</h2>
      <Card className="mb-6">
        <Row title={t.settings.geluid} hint={t.settings.geluidHint}>
          <Toggle on={s.sound} onChange={set('sound')} label={t.settings.geluid} />
        </Row>
        <Row title={t.settings.effecten} hint={t.settings.effectenHint}>
          <Button variant="secondary" onClick={() => sfx.demo()}>{t.settings.speel}</Button>
        </Row>
        <SoundCheck />
        <Row title={t.settings.mediakanaal} hint={t.settings.mediakanaalHint}>
          <Toggle
            on={s.mediaSound}
            onChange={(v) => {
              setSetting('mediaSound', v)
              setSetting('mediaSoundPicked', true)
              if (v) void prepareSamples()
            }}
            label={t.settings.mediakanaal}
          />
        </Row>
        {/* The narrator on a history card is not the Darija voice: it reads
            the learner's own language, and a device may have one and not the
            other. So it says out loud which of the two it cannot do. */}
        <Row
          title={t.settings.voorlezen}
          hint={canNarrate(localeOf(s.lang)) ? t.settings.voorlezenHint : t.settings.voorlezenGeenStem}
        >
          <Toggle on={s.voorlezen} onChange={set('voorlezen')} label={t.settings.voorlezen} />
        </Row>
        {/* The honest line. Every engine on every phone reads Standard
            Arabic, so without a recording the app is approximating a
            different language, and it says so rather than pretending. */}
        <Row title={t.settings.uitspraak} hint={`${voiceStatus} ${t.settings.geenDarija}`}>
          <Button variant="secondary" onClick={() => say('السلام عليكم', { tr: 'ssalamu 3alaykum' })}>
            {t.common.test}
          </Button>
        </Row>
        <Row
          title={t.settings.stem}
          hint={canSpeak() ? t.settings.stemAantal(arabic.length, all.length) : t.settings.geenSpraak}
        >
          {/* Alleen stemmen die iets kunnen met dit schrift of met de
              Latijnse schrijfwijze. Een telefoon heeft er zestig, in talen van
              Thais tot Bulgaars; die aanbieden is geen keuze maar een valkuil.
              Ze staan in twee groepen, zodat je ziet wat een stem doet. */}
          <select
            id="voice"
            value={s.voiceURI}
            onChange={(e) => setSetting('voiceURI', e.target.value)}
            className="max-w-56 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 outline-none focus:border-zellige-500"
          >
            <option value="">{t.settings.stemAuto}</option>
            {bruikbaar.arabisch.length > 0 && (
              <optgroup label={t.settings.stemGroepArabisch}>
                {bruikbaar.arabisch.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name} — {v.lang}</option>
                ))}
              </optgroup>
            )}
            {bruikbaar.benadering.length > 0 && (
              <optgroup label={t.settings.stemGroepBenadering}>
                {bruikbaar.benadering.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name} — {v.lang}</option>
                ))}
              </optgroup>
            )}
          </select>
        </Row>
        <Row title={t.settings.snelheid} hint={t.settings.snelheidHint}>
          <Choice
            value={s.voiceRate}
            onChange={set('voiceRate')}
            options={[
              { value: 0.7, label: t.settings.traag },
              { value: 0.85, label: t.settings.normaal },
              { value: 1, label: t.settings.snel },
            ]}
          />
        </Row>
        <Row title={t.settings.benadering} hint={t.settings.benaderingHint}>
          <Toggle on={s.fallbackVoice} onChange={set('fallbackVoice')} label={t.settings.benadering} />
        </Row>
        <Row title={t.settings.spreekoefeningen} hint={canListen() ? t.settings.spreekJa : t.settings.spreekNee}>
          <Toggle on={s.speech} onChange={set('speech')} label={t.settings.spreekoefeningen} />
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">{t.settings.spelenTitel}</h2>
      <Card className="mb-6">
        <Row title={t.settings.hartjes} hint={t.settings.hartjesHint}>
          <Toggle on={s.hearts} onChange={set('hearts')} label={t.settings.hartjes} />
        </Row>
        <Row title={t.settings.film} hint={t.settings.filmHint}>
          <Toggle on={s.film} onChange={set('film')} label={t.settings.film} />
        </Row>

        <Row title={t.settings.schrijven} hint={t.settings.schrijvenHint}>
          <Toggle on={s.schrijven} onChange={set('schrijven')} label={t.settings.schrijven} />
        </Row>
        {/* Alleen in de app: een browser op een iPhone kan niet trillen, dus
            een schakelaar ervoor op het web is een schakelaar voor niets. */}
        {kanTrillen() && (
          <Row title={t.settings.trillen} hint={t.settings.trillenHint}>
            <Toggle on={s.trillen} onChange={set('trillen')} label={t.settings.trillen} />
          </Row>
        )}
        {/* Ook alleen in de app. Een browser kan geen wekker zetten die
            afgaat als hij dicht is, en dat is precies wat een reeks nodig
            heeft. */}
        {kanHerinneren() && (
          <Row title={t.settings.herinnering} hint={t.settings.herinneringHint}>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <input
                type="time"
                value={s.herinneringTijd}
                aria-label={t.settings.herinneringTijd}
                onChange={(e) => {
                  set('herinneringTijd')(e.target.value)
                  if (s.herinnering) {
                    void zetHerinnering(true, e.target.value, {
                      titel: t.settings.herinneringTitel, body: t.settings.herinneringBody,
                    })
                  }
                }}
                className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-raised)] px-3 py-1.5 font-display font-extrabold"
              />
              <Toggle
                on={s.herinnering}
                label={t.settings.herinnering}
                onChange={(aan) => {
                  // Pas aanzetten als het toestel ja zegt: een schakelaar die
                  // aan staat terwijl er niets gebeurt is erger dan geen
                  // schakelaar.
                  void zetHerinnering(aan, s.herinneringTijd, {
                    titel: t.settings.herinneringTitel, body: t.settings.herinneringBody,
                  }).then((gelukt) => set('herinnering')(aan && gelukt))
                }}
              />
            </div>
          </Row>
        )}
        <Row title={t.settings.beweging} hint={t.settings.bewegingHint}>
          <Choice
            value={s.motion}
            onChange={set('motion')}
            options={[{ value: 'full', label: t.settings.vol }, { value: 'calm', label: t.settings.rustig }]}
          />
        </Row>
        <Row title={t.settings.thema}>
          <Choice
            value={s.theme}
            onChange={set('theme')}
            options={[
              { value: 'system', label: t.settings.systeem },
              { value: 'light', label: t.settings.licht },
              { value: 'dark', label: t.settings.donker },
            ]}
          />
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">{t.settings.gegevensTitel}</h2>
      <Card className="mb-6">
        {DEMO ? (
          <Row title={t.settings.opslaan} hint={t.settings.opslaanDemo} />
        ) : (
          <Row title={t.settings.opslaan} hint={t.settings.opslaanHint}>
            <Button variant="secondary" onClick={download}>{t.settings.download}</Button>
          </Row>
        )}
        <Row title={t.settings.terugzetten} hint={imported ?? t.settings.terugzettenHint}>
          <>
            <input
              id="restore"
              ref={file}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setImported(importProgress(await f.text()) ? t.settings.terugzettenGelukt : t.settings.terugzettenMislukt)
              }}
            />
            <Button variant="secondary" onClick={() => file.current?.click()}>{t.settings.kiesBestand}</Button>
          </>
        </Row>
        <Row title={t.settings.wissen} hint={t.settings.wissenHint}>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>{t.settings.wissenKnop}</Button>
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">{t.feedback.titel}</h2>
      <Card className="mb-6 divide-y divide-[var(--line)]">
        <Row title={t.feedback.knop} hint={t.feedback.uitleg}>
          <FeedbackButton className="js-feedback" label={t.feedback.voet} />
        </Row>
      </Card>

      {/*
        * De opnamestudio staat alleen in de demo en in de ontwikkelversie, en
        * had tot nu toe geen enkele ingang: je moest /opname in de adresbalk
        * typen om er te komen. Wie de woorden inspreekt is geen kind en geen
        * ouder maar wij, dus staat het er in het Nederlands en alleen hier.
        */}
      {DEMO && (
        <>
          <h2 className="mb-2 font-display text-lg font-extrabold">Voor de makers</h2>
          <Card className="mb-6">
            <Row
              title="Opnamestudio"
              hint="Woorden en letters inspreken. Staat niet in de app die een kind gebruikt."
            >
              <Link to="/opname">
                <Button variant="secondary">Openen</Button>
              </Link>
            </Row>
          </Card>
        </>
      )}

      <p className="text-center text-sm text-[var(--ink-soft)]">
        <Link to="/ouders" className="font-bold underline">{t.settings.oudersLink}</Link>
      </p>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} labelledBy="reset-title">
        <h2 id="reset-title" className="font-display text-xl font-extrabold">{t.settings.wissenZeker}</h2>
        <p className="mt-2 text-[var(--ink-soft)]">{t.settings.wissenUitleg}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmReset(false)}>{t.common.annuleren}</Button>
          <Button variant="danger" className="flex-1" onClick={() => { resetProgress(); setConfirmReset(false) }}>
            {t.settings.wissenKnop}
          </Button>
        </div>
      </Sheet>
    </div>
  )
}
