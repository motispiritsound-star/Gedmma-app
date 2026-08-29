import type { Locale } from '@focusfamily/domain';
import { translate } from '@focusfamily/domain';
import { SourceLabel } from './SourceLabel';

export function FigureRow({
  labelKey,
  value,
  sourceKind,
  confidence,
  locale,
}: {
  labelKey: string;
  value: number | string | null;
  sourceKind: 'self_reported' | 'app_observed' | 'os_verified' | 'simulated';
  confidence?: string;
  locale: Locale;
}) {
  return (
    <div className="figure-row">
      <div>
        <div>{translate(locale, labelKey)}</div>
        <SourceLabel kind={sourceKind} confidence={confidence} locale={locale} />
      </div>
      <div className="figure-row__value">
        {value === null ? <span aria-label="geen gegevens">—</span> : value}
      </div>
    </div>
  );
}
