import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  exportProgress, importProgress, resetProgress, setSetting, setState, useStore, type Settings,
} from '../engine/store'
import { arabicVoice, canListen, canSpeak, say } from '../engine/audio'
import { Button, Card, SectionTitle, Sheet } from '../ui/kit'

/** The embedded demo runs in a sandbox where a page cannot hand over a file. */
const DEMO = import.meta.env.VITE_DEMO === '1'

function Row({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
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
      onClick={() => onChange(!on)}
      className={`h-8 w-14 rounded-full border-2 p-0.5 transition ${on ? 'border-mint-600 bg-mint-500' : 'border-[var(--line)] bg-[var(--surface-sunken)]'}`}
    >
      <span className={`block h-6 w-6 rounded-full bg-white shadow transition ${on ? 'translate-x-6' : ''}`} />
    </button>
  )
}

function Choice<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl bg-[var(--surface-sunken)] p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`rounded-xl px-3 py-1.5 text-sm font-bold ${value === o.value ? 'bg-[var(--surface-raised)] shadow' : 'text-[var(--ink-soft)]'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SettingsPage() {
  const state = useStore((s) => s)
  const s = state.settings
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => setSetting(k, v)
  const [confirmReset, setConfirmReset] = useState(false)
  const [imported, setImported] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gedmma-voortgang-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SectionTitle sub="Alles staat op dit apparaat. Er is geen account en er gaat niets naar een server.">
        Instellingen
      </SectionTitle>

      <Card className="mb-6">
        <Row title="Naam" hint="Hoe de app je aanspreekt.">
          <input
            value={state.name}
            onChange={(e) => setState({ name: e.target.value.slice(0, 24) })}
            placeholder="Je naam"
            className="w-40 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 outline-none focus:border-zellige-500"
          />
        </Row>
        <Row title="Dagdoel" hint="Hoeveel XP je per dag wilt halen.">
          <Choice
            value={s.dailyGoal}
            onChange={set('dailyGoal')}
            options={[
              { value: 15, label: 'Rustig 15' },
              { value: 30, label: 'Normaal 30' },
              { value: 50, label: 'Stevig 50' },
              { value: 80, label: 'Streber 80' },
            ]}
          />
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">Lezen en schrift</h2>
      <Card className="mb-6">
        <Row title="Arabisch schrift tonen" hint="خبز naast of in plaats van khobz.">
          <Toggle on={s.showScript} onChange={set('showScript')} label="Arabisch schrift tonen" />
        </Row>
        <Row title="Latijnse letters tonen" hint="De schrijfwijze met 3, 7 en 9.">
          <Toggle on={s.showTranslit} onChange={set('showTranslit')} label="Latijnse letters tonen" />
        </Row>
        <Row title="Betekenissen in" hint="De taal waarin de vertaling verschijnt.">
          <Choice value={s.lang} onChange={set('lang')} options={[{ value: 'nl', label: 'Nederlands' }, { value: 'en', label: 'English' }]} />
        </Row>
        <Row title="Lettertype" hint="Extra rustig lettertype met meer ruimte tussen de letters.">
          <Choice value={s.reading} onChange={set('reading')} options={[{ value: 'normal', label: 'Normaal' }, { value: 'dyslexia', label: 'Dyslexie' }]} />
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">Geluid</h2>
      <Card className="mb-6">
        <Row title="Geluid en uitspraak" hint={canSpeak() ? 'Gebruikt de stem van je apparaat.' : 'Deze browser heeft geen spraak.'}>
          <Toggle on={s.sound} onChange={set('sound')} label="Geluid" />
        </Row>
        <Row title="Spreeksnelheid" hint="Langzamer helpt bij nieuwe woorden.">
          <Choice
            value={s.voiceRate}
            onChange={set('voiceRate')}
            options={[{ value: 0.7, label: 'Traag' }, { value: 0.85, label: 'Normaal' }, { value: 1, label: 'Snel' }]}
          />
        </Row>
        <Row title="Spreekoefeningen" hint={canListen() ? 'Je microfoon luistert alleen tijdens de oefening.' : 'Deze browser kan niet meeluisteren.'}>
          <Toggle on={s.speech} onChange={set('speech')} label="Spreekoefeningen" />
        </Row>
        <Row title="Stem testen" hint={arabicVoice() ? `Gevonden stem: ${arabicVoice()?.name}` : 'Geen Arabische stem gevonden — de uitspraak klinkt dan onnatuurlijk.'}>
          <Button variant="secondary" onClick={() => say('السلام عليكم')}>Test</Button>
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">Spelen</h2>
      <Card className="mb-6">
        <Row title="Hartjes" hint="Uit betekent: fouten maken kost niets. Aanrader voor jonge kinderen.">
          <Toggle on={s.hearts} onChange={set('hearts')} label="Hartjes" />
        </Row>
        <Row title="Beweging" hint="Rustig zet animaties en confetti uit.">
          <Choice value={s.motion} onChange={set('motion')} options={[{ value: 'full', label: 'Vol' }, { value: 'calm', label: 'Rustig' }]} />
        </Row>
        <Row title="Thema">
          <Choice
            value={s.theme}
            onChange={set('theme')}
            options={[{ value: 'system', label: 'Systeem' }, { value: 'light', label: 'Licht' }, { value: 'dark', label: 'Donker' }]}
          />
        </Row>
      </Card>

      <h2 className="mb-2 font-display text-lg font-extrabold">Je gegevens</h2>
      <Card className="mb-6">
        {DEMO ? (
          <Row title="Voortgang opslaan" hint="In de geïnstalleerde app download je hier een kopie van je voortgang. Deze demo draait in een venster dat geen bestanden mag doorgeven." />
        ) : (
          <Row title="Voortgang opslaan" hint="Een bestand dat je zelf bewaart of naar een ander apparaat brengt.">
            <Button variant="secondary" onClick={download}>Download</Button>
          </Row>
        )}
        <Row title="Voortgang terugzetten" hint={imported ?? 'Kies een eerder opgeslagen bestand.'}>
          <>
            <input
              ref={file}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setImported(importProgress(await f.text()) ? 'Gelukt — je voortgang staat terug.' : 'Dat bestand herkende ik niet.')
              }}
            />
            <Button variant="secondary" onClick={() => file.current?.click()}>Kies bestand</Button>
          </>
        </Row>
        <Row title="Alles wissen" hint="Woorden, reeks, beloningen — alles begint opnieuw.">
          <Button variant="danger" onClick={() => setConfirmReset(true)}>Wissen</Button>
        </Row>
      </Card>

      <p className="text-center text-sm text-[var(--ink-soft)]">
        Ouder of leerkracht? Lees <Link to="/ouders" className="font-bold underline">wat Gedmma wel en niet doet</Link>.
      </p>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} labelledBy="reset-title">
        <h2 id="reset-title" className="font-display text-xl font-extrabold">Weet je het zeker?</h2>
        <p className="mt-2 text-[var(--ink-soft)]">
          Alle voortgang op dit apparaat verdwijnt. Download eerst een kopie als je hem wilt bewaren.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmReset(false)}>Annuleren</Button>
          <Button variant="danger" className="flex-1" onClick={() => { resetProgress(); setConfirmReset(false) }}>Wissen</Button>
        </div>
      </Sheet>
    </div>
  )
}
