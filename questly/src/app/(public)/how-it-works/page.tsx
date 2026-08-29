import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/Button'
import { Callout } from '@/components/ui/States'
import { getTranslations } from '@/modules/localisation/server'

export const metadata: Metadata = { title: 'How it works' }

export default async function HowItWorksPage() {
  const { locale, d } = await getTranslations()

  const detail =
    locale === 'nl'
      ? [
          {
            title: 'Avontuurmodus is bewust saai op het scherm',
            body: 'Als een avontuur start zie je één scherm: de voorbereiding, de eerste stap en een duidelijke vraag om het apparaat weg te leggen. Er is geen feed, geen melding en niets dat je terugtrekt. Kom je terug voor de volgende stap, dan staat die er gewoon.',
          },
          {
            title: 'Voorlezen in plaats van meelezen',
            body: 'Elke stap kan voorgelezen worden door de browser. Zo kan een kind van acht meedoen zonder te lezen, en hoeft niemand het scherm vast te houden.',
          },
          {
            title: 'Ouders keuren af',
            body: 'Standaard rondt een kind een avontuur af en keurt een ouder het goed. Zo blijft het gesprek over wat er gedaan is onderdeel van het spel. Je kunt dit uitzetten voor oudere kinderen.',
          },
          {
            title: 'Vooruitgang zonder verslavende trucs',
            body: 'Geen dagelijkse reeksen, geen ranglijsten, geen loot boxes. Je verzamelt vaardigheden, afgeronde projecten en gezinsmijlpalen — allemaal gekoppeld aan iets wat je echt gedaan hebt.',
          },
          {
            title: 'Wat we niet kunnen',
            body: 'Een webapp kan geen andere apps blokkeren en geen schermtijd meten. Dat beloven we dus niet. We meten alleen wat jullie zelf invullen na een avontuur.',
          },
        ]
      : [
          {
            title: 'Adventure Mode is deliberately dull on screen',
            body: 'When an adventure starts you get one screen: the preparation, the first step, and a clear invitation to put the device away. No feed, no notification, nothing pulling you back. Come back for the next step and it is simply there.',
          },
          {
            title: 'Read aloud instead of read along',
            body: 'Every step can be spoken by the browser. An eight-year-old can take part without reading, and nobody has to hold the screen.',
          },
          {
            title: 'Parents approve',
            body: 'By default a child finishes an adventure and a parent approves it, which keeps the conversation about what happened part of the game. You can switch this off for older children.',
          },
          {
            title: 'Progress without addictive tricks',
            body: 'No daily streaks, no leaderboards, no loot boxes. You collect skills, finished projects and family milestones - all tied to something you actually did.',
          },
          {
            title: 'What we cannot do',
            body: 'A web app cannot block other apps or measure screen time, so we do not promise that. We only record what you tell us after an adventure.',
          },
        ]

  return (
    <div className="q-container py-14">
      <h1 className="text-3xl font-semibold">{d.nav.howItWorks}</h1>
      <p className="q-prose mt-3 text-lg text-ink-soft">{d.landing.heroBody}</p>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {detail.map((item) => (
          <section key={item.title} className="q-card p-6">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-ink-soft">{item.body}</p>
          </section>
        ))}
      </div>

      <Callout tone="warning" className="mt-8" title={d.landing.honestTitle}>
        {d.landing.honestBody}
      </Callout>

      <div className="mt-10">
        <ButtonLink href="/register" size="lg">
          {d.landing.heroPrimary}
        </ButtonLink>
      </div>
    </div>
  )
}
