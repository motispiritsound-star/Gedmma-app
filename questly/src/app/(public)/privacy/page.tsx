import type { Metadata } from 'next'
import Link from 'next/link'
import { Callout } from '@/components/ui/States'
import { getTranslations } from '@/modules/localisation/server'

export const metadata: Metadata = { title: 'Privacy overview' }

export default async function PrivacyPage() {
  const { locale, d } = await getTranslations()

  const sections =
    locale === 'nl'
      ? [
          {
            title: 'Wat we van kinderen bewaren',
            items: [
              'Een bijnaam die de ouder kiest — geen volledige naam.',
              'Een leeftijdsgroep (6-8, 9-11 of 12-15) — geen geboortedatum.',
              'Een gekozen avatar — nooit een foto van het kind.',
              'Een paar interesses, om avonturen voor te stellen.',
            ],
          },
          {
            title: 'Wat we bewust níét doen',
            items: [
              'Geen openbare kinderprofielen en geen zoekfunctie op kinderen.',
              'Geen berichten tussen gebruikers en geen openbare inhoud.',
              'Geen advertenties en geen advertentieprofielen.',
              'Geen verkoop van gegevens, en geen precieze locatiegeschiedenis.',
            ],
          },
          {
            title: 'Foto’s en herinneringen',
            items: [
              'Uploaden is optioneel; niets in de app dringt erop aan.',
              'Elke upload is standaard privé en alleen zichtbaar voor het eigen gezin.',
              'Links naar foto’s zijn ondertekend en verlopen na een paar minuten.',
              'Beheerders hebben geen toegang tot foto’s van gezinnen.',
            ],
          },
          {
            title: 'Toestemming en zeggenschap',
            items: [
              'Een ouder maakt het account en geeft toestemming voor de kindprofielen.',
              'Je kunt al je gegevens exporteren als JSON-bestand.',
              'Je kunt verwijdering aanvragen; daarna volgt een bedenktijd voordat alles definitief weg is.',
              'Gevoelige beheerhandelingen worden vastgelegd in een auditlog.',
            ],
          },
        ]
      : [
          {
            title: 'What we store about children',
            items: [
              'A nickname chosen by the parent - never a full legal name.',
              'An age band (6-8, 9-11 or 12-15) - not a date of birth.',
              'A chosen avatar - never a photograph of the child.',
              'A few interests, used to suggest suitable adventures.',
            ],
          },
          {
            title: 'What we deliberately do not do',
            items: [
              'No public child profiles and no way to search for children.',
              'No messaging between users and no open user-generated content.',
              'No advertising and no advertising profiles.',
              'No sale of data, and no precise location history.',
            ],
          },
          {
            title: 'Photographs and memories',
            items: [
              'Uploading is optional; nothing in the app pushes you towards it.',
              'Every upload is private by default and visible only to your own family.',
              'Links to photographs are signed and expire after a few minutes.',
              'Administrators have no access to family photographs.',
            ],
          },
          {
            title: 'Consent and control',
            items: [
              'A parent creates the account and consents on behalf of the child profiles.',
              'You can export everything we hold as a JSON file.',
              'You can request deletion; a grace period follows before data is removed for good.',
              'Sensitive administrative actions are recorded in an audit log.',
            ],
          },
        ]

  return (
    <div className="q-container py-14">
      <h1 className="text-3xl font-semibold">{d.nav.privacy}</h1>
      <p className="q-prose mt-3 text-lg text-ink-soft">
        {locale === 'nl'
          ? 'Questly is gebouwd rond dataminimalisatie: we vragen alleen wat nodig is om een passend avontuur voor te stellen.'
          : 'Questly is built around data minimisation: we ask only for what is needed to suggest a suitable adventure.'}
      </p>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="q-card p-6">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Callout tone="warning" className="mt-8">
        {locale === 'nl'
          ? 'Dit overzicht beschrijft hoe het product technisch werkt. Het is geen juridische privacyverklaring en er heeft nog geen juridische toetsing plaatsgevonden. Voor een echte lancering is beoordeling door een jurist vereist.'
          : 'This overview describes how the product works technically. It is not a legal privacy statement, and no legal review has taken place. A real launch requires review by a qualified lawyer.'}
      </Callout>

      <p className="mt-6 text-sm text-ink-soft">
        <Link href="/register" className="font-semibold text-moss-700 underline">
          {d.landing.heroPrimary}
        </Link>
      </p>
    </div>
  )
}
