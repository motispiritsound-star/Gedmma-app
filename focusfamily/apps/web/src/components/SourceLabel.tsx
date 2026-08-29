import { translate, type DataSourceKind, type Locale } from '@focusfamily/domain';

export interface SourceLabelProps {
  readonly kind: DataSourceKind;
  readonly confidence?: string;
  readonly locale: Locale;
  /** Show the longer explanation underneath, for first-time screens. */
  readonly explain?: boolean;
}

/**
 * Every number in FocusFamily is rendered next to one of these. The label is
 * not decoration: it is the difference between "your child spent 90 minutes"
 * and "you told us 90 minutes".
 */
export function SourceLabel({ kind, confidence, locale, explain = false }: SourceLabelProps) {
  const label = translate(locale, `source.${kind}.label`);
  const explanation = translate(locale, `source.${kind}.explanation`);
  const confidenceText = confidence ? translate(locale, `confidence.${confidence}`) : null;

  return (
    <span>
      <span className="source-label" data-kind={kind}>
        <span className="source-label__dot" aria-hidden="true" />
        {label}
        {confidenceText ? <span aria-hidden="true"> · {confidenceText}</span> : null}
        {confidenceText ? (
          <span className="visually-hidden">, {confidenceText}</span>
        ) : null}
      </span>
      {explain ? (
        <span
          style={{
            display: 'block',
            fontSize: '0.85rem',
            color: 'var(--ink-soft)',
            marginTop: '6px',
            maxWidth: '52ch',
          }}
        >
          {explanation}
        </span>
      ) : null}
    </span>
  );
}
