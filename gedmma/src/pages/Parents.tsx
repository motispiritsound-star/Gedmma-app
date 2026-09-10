import { Link } from 'react-router-dom'
import { UNITS } from '../content/curriculum'
import { allWords } from '../content/lexicon'
import { levelOf, today, useStore } from '../engine/store'
import { Button, Card, SectionTitle, Stat } from '../ui/kit'
import { Mascot } from '../ui/Mascot'

/** For the adult in the room: what the app does, and how the child is doing. */
export function Parents() {
  const state = useStore((s) => s)
  const seen = Object.keys(state.cards).length
  const solid = Object.values(state.cards).filter((c) => c.strength >= 0.85).length
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return state.daily[today(d)] ?? 0
  })
  const weekXp = week.reduce((a, b) => a + b, 0)
  const activeDays = week.filter((x) => x > 0).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub="Wat deze app doet, wat hij bewust niet doet, en hoe het gaat.">
        Voor ouders en leerkrachten
      </SectionTitle>

      <Card className="mb-8 p-5">
        <h2 className="font-display text-xl font-extrabold">Deze week</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={weekXp} label="XP deze week" emoji="⚡" />
          <Stat value={`${activeDays}/7`} label="dagen geoefend" emoji="📅" />
          <Stat value={`${seen}/${allWords.length}`} label="woorden gezien" emoji="📚" />
          <Stat value={solid} label="woorden vast" emoji="🔒" />
        </div>
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          Niveau {levelOf(state.xp).level} · {Object.keys(state.lessons).length} lessen afgerond ·
          langste reeks {state.bestStreak} dagen. Tien minuten per dag werkt beter dan een uur in het weekend.
        </p>
      </Card>

      <h2 className="mb-3 font-display text-xl font-extrabold">Hoe er geleerd wordt</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <span className="text-3xl" aria-hidden="true">🔁</span>
          <h3 className="mt-1 font-display font-extrabold">Herhalen op het juiste moment</h3>
          <p className="text-sm text-[var(--ink-soft)]">
            Elk woord krijgt een eigen ritme. Wat goed gaat komt later terug, wat lastig is meteen weer.
            Dat heet spaced repetition en het is de best onderzochte manier om woorden vast te zetten.
          </p>
        </Card>
        <Card className="p-5">
          <span className="text-3xl" aria-hidden="true">👂</span>
          <h3 className="mt-1 font-display font-extrabold">Eerst horen, dan schrijven</h3>
          <p className="text-sm text-[var(--ink-soft)]">
            Darija is vooral een spreektaal. Elk woord kan worden voorgelezen, en het Arabische schrift staat er
            altijd naast — je kunt het ook uitzetten voor wie nog niet leest.
          </p>
        </Card>
        <Card className="p-5">
          <span className="text-3xl" aria-hidden="true">🧩</span>
          <h3 className="mt-1 font-display font-extrabold">Korte lessen</h3>
          <p className="text-sm text-[var(--ink-soft)]">
            Een les duurt twee tot vier minuten en mengt zes soorten oefeningen, zodat een kind niet in één
            trucje blijft hangen.
          </p>
        </Card>
        <Card className="p-5">
          <span className="text-3xl" aria-hidden="true">❤️</span>
          <h3 className="mt-1 font-display font-extrabold">Zonder straf</h3>
          <p className="text-sm text-[var(--ink-soft)]">
            Hartjes kunnen helemaal uit. Herhalen kost nooit hartjes. Er zijn geen advertenties, geen aankopen
            en geen meldingen die een kind terugtrekken.
          </p>
        </Card>
      </div>

      <h2 className="mb-3 font-display text-xl font-extrabold">Privacy, kort</h2>
      <Card className="mb-8 p-5">
        <ul className="space-y-2 text-sm">
          <li>✅ Geen account, geen e-mailadres, geen inloggen.</li>
          <li>✅ Alle voortgang staat in de browser van dit apparaat en gaat nergens heen.</li>
          <li>✅ Geen advertenties, geen trackers, geen cookies van derden.</li>
          <li>✅ De uitspraak komt van de stem die al op het apparaat staat; er wordt geen audio verstuurd.</li>
          <li>
            ⚠️ Spreekoefeningen gebruiken de spraakherkenning van de browser. Bij Chrome betekent dat dat de
            opname naar Google gaat — zet spreekoefeningen uit als je dat niet wilt.
          </li>
          <li>✅ Voortgang wissen of meenemen naar een ander apparaat kan bij <Link to="/instellingen" className="font-bold underline">instellingen</Link>.</li>
        </ul>
      </Card>

      <h2 className="mb-3 font-display text-xl font-extrabold">Thuis meehelpen</h2>
      <Card className="mb-8 p-5">
        <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
          <li><strong className="text-[var(--ink)]">Vraag het na.</strong> “Kifash kanqolo brood?” — laat je kind jou iets leren. Uitleggen is de beste oefening.</li>
          <li><strong className="text-[var(--ink)]">Gebruik één woord per dag echt.</strong> Zeg bslama bij het weggaan, bsseha bij het eten.</li>
          <li><strong className="text-[var(--ink)]">Bel familie.</strong> Vijf zinnen tegen jeddti doen meer dan twintig lessen.</li>
          <li><strong className="text-[var(--ink)]">Laat variatie toe.</strong> Elke stad heeft eigen woorden. Zegt oma het anders, dan heeft oma gelijk.</li>
        </ul>
      </Card>

      <h2 className="mb-3 font-display text-xl font-extrabold">In de klas</h2>
      <Card className="mb-8 p-5 text-sm text-[var(--ink-soft)]">
        <p>
          De app draait in elke browser zonder installatie of account, dus een klas kan meteen aan de slag — ook
          op een chromebook. Elk apparaat houdt zijn eigen voortgang bij. Voor een gezamenlijke les werken de
          verhalen en het letterspel goed op het digibord; het woordenboek ({allWords.length} woorden) is te
          gebruiken als naslagwerk. De {UNITS.length} units volgen een oplopend niveau van A0 tot A2.
        </p>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Mascot mood="blij" size={64} />
          <p className="min-w-0 flex-1 text-sm text-[var(--ink-soft)]">
            <strong className="text-[var(--ink)]">Eerlijk over de taal:</strong> Darija verschilt per streek en per
            familie, en er is geen officiële spelling. Wij kiezen de vorm die je in Casablanca en Rabat het meest
            hoort, met het Arabische schrift zoals mensen het in berichten typen. De stem van je apparaat spreekt
            Modern Standaard Arabisch — herkenbaar, maar geen echte Marokkaanse tongval. Luisteren naar familie
            blijft dus het echte werk.
          </p>
        </div>
      </Card>

      <div className="mt-8 text-center">
        <Link to="/leren"><Button>Naar het leerpad</Button></Link>
      </div>
    </div>
  )
}
