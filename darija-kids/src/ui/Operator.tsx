import { OPERATOR, traderKnown } from '../content/operator'
import { Card } from './kit'
import { useT } from '../i18n'

/**
 * The trader block, on the privacy page and on the terms page.
 *
 * Not decoration: since the Digital Services Act, someone selling through an
 * app store has to be findable — by name, by address, by phone and by trade
 * register. Both stores publish these on the listing, and a buyer who wants to
 * complain should not have to go to a store to find out who they bought from.
 *
 * The address and the number are printed, not linked. The law asks that they
 * be readable; the Kids Category asks that a child cannot tap their way out of
 * the app into a mail draft or a phone call. Printing them satisfies both, and
 * an adult who wants to write still can — the text selects and copies.
 */
export function OperatorBlock() {
  const t = useT()
  if (!traderKnown()) return null

  const rows: [string, string][] = [
    [t.operator.naam, OPERATOR.name],
    ...(OPERATOR.bedrijf && OPERATOR.bedrijf !== OPERATOR.name
      ? ([[t.operator.bedrijf, OPERATOR.bedrijf]] as [string, string][])
      : []),
    [t.operator.adres, [OPERATOR.address, OPERATOR.country].filter(Boolean).join(', ')],
    [t.operator.telefoon, OPERATOR.phone],
    [t.operator.email, OPERATOR.email],
    [t.operator.kvk, OPERATOR.registration],
    ...(OPERATOR.vat ? ([[t.operator.btw, OPERATOR.vat]] as [string, string][]) : []),
  ]

  return (
    <Card className="mt-8 p-5">
      <h2 className="font-display text-lg font-extrabold">{t.operator.titel}</h2>
      <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            {/* `break-words`: een adres of een nummer is één woord zonder
                spaties, en dat duwt de kolom breder dan de kaart. Gemeten op
                320px bij een wortelgrootte van 24px: 23px buiten beeld. */}
            <dt className="min-w-0 break-words font-bold text-[var(--ink-soft)]">{label}</dt>
            <dd className={`min-w-0 break-words ${label === t.operator.email || label === t.operator.telefoon ? 'font-bold' : ''}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
