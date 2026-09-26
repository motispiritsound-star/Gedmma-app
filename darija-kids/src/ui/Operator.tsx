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
    /* Alleen als er een nummer staat. Het staat er niet meer — zie
       `operator.ts` — en een rij met een leeg vak erachter is erger dan geen
       rij. */
    ...(OPERATOR.phone ? ([[t.operator.telefoon, OPERATOR.phone]] as [string, string][]) : []),
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
            <dt className="font-bold text-[var(--ink-soft)]">{label}</dt>
            <dd>
              {label === t.operator.email
                ? <a className="font-bold underline" href={`mailto:${value}`}>{value}</a>
                : label === t.operator.telefoon
                  ? <a className="font-bold underline" href={`tel:${value.replace(/[^\d+]/g, '')}`}>{value}</a>
                  : value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
