import { Link } from 'react-router-dom'
import { OPERATOR, operatorKnown } from '../content/operator'
import { PRIVACY } from '../i18n/privacy'
import { useLang, useT } from '../i18n'
import { Button, Card, SectionTitle } from '../ui/kit'
import { OperatorBlock } from '../ui/Operator'

/** The statement both app stores ask for, and the GDPR requires anyway. */
export function Privacy() {
  const t = useT()
  const lang = useLang()
  const text = PRIVACY[lang]

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SectionTitle sub={text.updated}>{text.title}</SectionTitle>
      <p className="text-[var(--ink-soft)]">{text.intro}</p>

      {!operatorKnown() && (
        <Card className="mt-6 border-saffron-500 bg-saffron-500/10 p-4 text-sm">
          ⚠️ {text.missing}
        </Card>
      )}

      <div className="mt-6 space-y-6">
        {text.sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl font-extrabold">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-[var(--ink-soft)]">{paragraph}</p>
            ))}
          </section>
        ))}
      </div>

      {operatorKnown() && (
        <p className="mt-8 text-[var(--ink-soft)]">
          {text.contact} <a className="font-bold underline" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
          {OPERATOR.name ? ` — ${OPERATOR.name}${OPERATOR.country ? `, ${OPERATOR.country}` : ''}` : ''}
        </p>
      )}

      <OperatorBlock />

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/ouders"><Button variant="secondary">{t.nav.ouders}</Button></Link>
        <Link to="/voorwaarden"><Button variant="secondary">{t.nav.voorwaarden}</Button></Link>
        <Link to="/leren"><Button>{t.nav.leren}</Button></Link>
      </div>
    </div>
  )
}
