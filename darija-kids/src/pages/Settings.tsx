import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ACCENTEN, ACCENTKLEUR, exportProgress, heeftStilteschakelaar, importProgress, resetProgress, setSetting,
  setState, useStore, type Settings,
} from '../engine/store'
import {
  arabicVoices, bruikbareStemmen, canNarrate, canSpeak, prepareSamples, probeSound, say, sfx, voicePlan,
  type SoundProbe,
} from '../engine/audio'
import { kanOpnemen } from '../engine/microfoon'
import { OuderPoort, poortAl } from '../ui/OuderPoort'
import { kanDownloaden, naarKlembord } from '../engine/klembord'
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
      // De knop is 44 hoog, het baantje erin blijft 32.
      //
      // Zo hoort een schakelaar eruit te zien én aan te voelen: iOS doet het
      // net zo, want een baantje van 44 pixels is log en een raakvlak van 32 is
      // te klein. Er staan er acht onder elkaar in deze lijst; mis je er een,
      // dan zet je de verkeerde instelling om en merk je dat pas later.
      className="flex h-11 w-14 shrink-0 items-center"
    >
      <span
        className={`block h-8 w-14 rounded-full border-2 p-0.5 transition ${on ? 'border-mint-600 bg-mint-500' : 'border-[var(--line)] bg-[var(--surface-sunken)]'}`}
      >
        <span className={`block h-6 w-6 rounded-full bg-white shadow transition ${on ? 'translate-x-6' : ''}`} />
      </span>
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
        ? t.settings.checkGoed(probe.level.toFixed(2), heeftStilteschakelaar())
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
        <p className="mt-1 text-xs text-[var(--ink-soft)]">{t.settings.mixerStil(heeftStilteschakelaar())}</p>
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
          // `min-h-11` is 44 pixels: de ondergrens die Apple en Google allebei
          // aanhouden voor iets wat je met een vinger raakt. Deze knoppen waren
          // 32 hoog — het zijn er vier naast elkaar in een smalle rij, en dan
          // tik je de buurman aan in plaats van degene die je bedoelde.
          className={`min-h-11 rounded-xl px-3 py-1.5 text-sm font-bold ${value === o.value ? 'bg-[var(--surface-raised)] shadow' : 'text-[var(--ink-soft)]'}`}
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
  /* De poort vóór het wissen; zie de knop verderop voor waarom hij er is. */
  const [wisPoort, setWisPoort] = useState(false)
  const [imported, setImported] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)
  /*
   * De twee vensters voor een kopie zonder bestand.
   *
   * `kopie` is de tekst die je meeneemt, `kopieStand` wat er van het kopiëren
   * terechtkwam, en `plak` het veld waarin hij terugkomt. Zie
   * `engine/klembord.ts` voor waarom dit er is: de downloadknop deed niets in
   * de twee builds die in de winkel staan.
   */
  const [kopie, setKopie] = useState<string | null>(null)
  const [kopieStand, setKopieStand] = useState<'niets' | 'goed' | 'mis'>('niets')
  const [plak, setPlak] = useState<string | null>(null)

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

  /** De weg zonder bestand: de tekst op het scherm, het klembord in. */
  const toonKopie = () => {
    setKopieStand('niets')
    setKopie(exportProgress())
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SectionTitle kop="h1" sub={t.settings.uitleg}>{t.settings.titel}</SectionTitle>

      <Card className="mb-6">
        <Row title={t.settings.taal} hint={t.settings.taalHint}>
          <div className="flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { sfx.nav(); setSetting('lang', l.code as Lang) }}
                // Drie pixels tekort: deze rij was 41 hoog, en 44 is waar een
                // vinger op mag rekenen.
                className={`min-h-11 rounded-xl border-2 px-3 py-2 text-sm font-bold ${s.lang === l.code ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'}`}
              >
                <span className="font-display font-extrabold" aria-hidden="true">{l.badge}</span> {l.name}
              </button>
            ))}
          </div>
        </Row>
        <Row title={t.settings.naam} hint={t.settings.naamHint}>
          <input
            id="name"
            /*
             * De titel links is een `div` en geen `label`, dus er is niets dat
             * dit veld een naam geeft. Een schermlezer las alleen de
             * plaatshouder voor, en dat is geen label: hij verdwijnt zodra er
             * iets staat, en precies dán wil iemand horen wat hij invult.
             */
            aria-label={t.settings.naam}
            value={state.name}
            onChange={(e) => setState({ name: e.target.value.slice(0, 24) })}
            placeholder={t.settings.naamPlaceholder}
            autoComplete="given-name"
            enterKeyHint="done"
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
          hint={state.unlocked ? t.unlock.alOpen : t.unlock.sub(TRIAL_DAYS, LIST_PRICE, gezinsdeling(), false)}
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
        {/*
          Alleen waar hij iets doet.

          Deze schakelaar speelt het geluid via losse bestanden in plaats van
          de mixer, en dat is een middel tegen één ding: het schuifje aan de
          zijkant van een iPhone, dat de mixer dempt en losse media niet. Op
          een toestel zonder dat schuifje levert hij niets op — alleen
          geluidjes die een tikje later komen. Een knop die alleen kan
          schaden hoort er niet te staan.

          Staat hij al aan, dan blijft hij zichtbaar. Anders kan iemand die
          hem ooit aanzette hem nergens meer uitzetten.
        */}
        {(heeftStilteschakelaar() || s.mediaSound) && (
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
        )}
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
            /* `py-2.5` en niet `py-2`: dit kwam uit op 41 hoog, en 44 is de
               ondergrens die Apple en Google allebei aanhouden. */
            className="max-w-[min(14rem,100%)] rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 outline-none focus:border-zellige-500"
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
        <Row title={t.settings.spreekoefeningen} hint={kanOpnemen() ? t.settings.spreekJa : t.settings.spreekNee}>
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
        {/*
          De kleur, met de kleur erin.

          Vier namen naast elkaar zeggen een kind niets -- "zellige" al
          helemaal niet. Dus staat de kleur zelf in de knop en de naam eronder
          voor wie hem voorleest. Dezelfde vier als op het startscherm; de
          kleuren staan in `index.css` onder `--accent-*`.
        */}
        <Row title={t.settings.accent} hint={t.settings.accentHint}>
          <div className="flex gap-2">
            {ACCENTEN.map((a) => (
              <button
                key={a}
                onClick={() => { sfx.tap(); set('accent')(a) }}
                aria-pressed={s.accent === a}
                aria-label={t.settings.accenten[a]}
                className={`h-11 w-11 rounded-full border-4 ${s.accent === a ? 'border-[var(--ink)]' : 'border-transparent'}`}
                style={{ backgroundColor: ACCENTKLEUR[a] }}
              />
            ))}
          </div>
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">{t.settings.gegevensTitel}</h2>
      <Card className="mb-6">
        {DEMO ? (
          <Row title={t.settings.opslaan} hint={t.settings.opslaanDemo} />
        ) : (
          /*
            Een bestand op het web, de tekst in de app.

            Hier stond één knop die een `<a download>` aantikte. In een browser
            levert dat een bestand op; in de app niets — Capacitor zet geen
            downloadluisteraar, dus de webweergave laat hem stil vallen. Geen
            bestand, geen melding, en dit is de knop waar het wisscherm naar
            verwijst. Zie `engine/klembord.ts`.
          */
          <Row title={t.settings.opslaan} hint={kanDownloaden() ? t.settings.opslaanHint : t.settings.opslaanGeenBestand}>
            {kanDownloaden()
              ? <Button variant="secondary" onClick={download}>{t.settings.download}</Button>
              : <Button variant="secondary" onClick={toonKopie}>{t.settings.kopieerKnop}</Button>}
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
            {/*
              Twee wegen terug, want er zijn twee wegen heen. Een bestand kiezen
              werkte altijd — een `<input type="file">` krijgt op Android een
              kiezer van `BridgeWebChromeClient` en op iOS van de webweergave
              zelf. Maar wie de tekst bewaarde in een notitie heeft geen
              bestand, en dan is plakken de enige weg.
            */}
            <Button variant="secondary" onClick={() => file.current?.click()}>{t.settings.kiesBestand}</Button>
            <Button variant="secondary" onClick={() => { setImported(null); setPlak('') }}>{t.settings.plakKnop}</Button>
          </>
        </Row>
        <Row title={t.settings.wissen} hint={t.settings.wissenHint}>
          {/*
            De poort erbij, want dit was de enige deur van dit soort zonder slot.

            Een abonnement kopen vraagt om een volwassene. Een mailadres
            achterlaten ook. De app uit gaan ook. Maar alles weggooien waren twee
            tikken: deze knop, en dan "Ja" in het venster — en een kind dat op
            onderzoek is in Instellingen komt daar even makkelijk langs als
            overal elders.

            De som is dezelfde die de andere drie deuren bewaakt, en `poortAl()`
            slaat hem over als er deze keer al een volwassene langs is geweest.
            Het bevestigingsvenster blijft staan: de poort vraagt wie je bent,
            het venster vraagt of je het zeker weet, en dat zijn twee vragen.
          */}
          <Button
            variant="danger"
            onClick={() => (poortAl() ? setConfirmReset(true) : setWisPoort(true))}
          >
            {t.settings.wissenKnop}
          </Button>
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

      {/*
        De tekst om mee te nemen. `readOnly` en niet `disabled`: een
        uitgeschakeld veld is niet te selecteren, en zelf selecteren is precies
        wat er overblijft als het klembord geweigerd wordt.
      */}
      <Sheet open={kopie !== null} onClose={() => setKopie(null)} labelledBy="kopie-titel">
        <h2 id="kopie-titel" className="font-display text-xl font-extrabold">{t.settings.kopieTitel}</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.settings.kopieUitleg}</p>
        <textarea
          readOnly
          value={kopie ?? ''}
          aria-label={t.settings.kopieTitel}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-3 h-40 w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-3 font-mono text-xs"
        />
        {kopieStand !== 'niets' && (
          <p role="status" className={`mt-2 text-sm ${kopieStand === 'goed' ? 'text-zellige-600' : 'text-terra-500'}`}>
            {kopieStand === 'goed' ? t.settings.gekopieerd : t.settings.kopieerHandmatig}
          </p>
        )}
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setKopie(null)}>{t.common.sluiten}</Button>
          <Button
            className="flex-1"
            onClick={async () => setKopieStand(await naarKlembord(kopie ?? '') ? 'goed' : 'mis')}
          >
            {t.settings.kopieerKnop}
          </Button>
        </div>
      </Sheet>

      {/* En terug. Hetzelfde `importProgress` als bij een bestand. */}
      <Sheet open={plak !== null} onClose={() => setPlak(null)} labelledBy="plak-titel">
        <h2 id="plak-titel" className="font-display text-xl font-extrabold">{t.settings.plakTitel}</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.settings.plakUitleg}</p>
        <textarea
          value={plak ?? ''}
          aria-label={t.settings.plakUitleg}
          onChange={(e) => setPlak(e.target.value)}
          className="mt-3 h-40 w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-3 font-mono text-xs"
        />
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setPlak(null)}>{t.common.annuleren}</Button>
          <Button
            className="flex-1"
            disabled={!plak?.trim()}
            onClick={() => {
              const goed = importProgress(plak ?? '')
              setImported(goed ? t.settings.terugzettenGelukt : t.settings.terugzettenMislukt)
              // Alleen weg als het gelukt is: wie zich vergiste hoeft zijn
              // tekst niet opnieuw te plakken om de melding te kunnen lezen.
              if (goed) setPlak(null)
            }}
          >
            {t.settings.plakBevestig}
          </Button>
        </div>
      </Sheet>

      <OuderPoort
        open={wisPoort}
        reden="wissen"
        onClose={() => setWisPoort(false)}
        onGoed={() => { setWisPoort(false); setConfirmReset(true) }}
      />

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
