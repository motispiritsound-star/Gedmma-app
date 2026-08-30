/**
 * Het design system: kleine, herbruikbare componenten met toegankelijkheid
 * ingebouwd. Geen enkele component bevat gebruikersgerichte tekst; die komt
 * altijd van buiten via `t()`.
 */
import { forwardRef, useEffect, useId, useRef, type ReactNode } from 'react';
import './ontwerp.css';

// --- Knop ------------------------------------------------------------------

export type KnopSoort = 'eerste' | 'tweede' | 'stil' | 'gevaar';

export type KnopProps = {
  soort?: KnopSoort;
  klein?: boolean;
  breed?: boolean;
  bezig?: boolean;
  children: ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'>;

export function Knop({ soort = 'eerste', klein, breed, bezig, children, ...rest }: KnopProps) {
  const klassen = ['knop'];
  if (soort !== 'eerste') klassen.push(`knop--${soort}`);
  if (klein) klassen.push('knop--klein');
  if (breed) klassen.push('knop--breed');

  return (
    <button
      type="button"
      {...rest}
      className={klassen.join(' ')}
      disabled={rest.disabled || bezig}
      aria-busy={bezig || undefined}
    >
      {children}
    </button>
  );
}

// --- Kaart -----------------------------------------------------------------

export function Kaart({
  titel,
  acties,
  strak,
  children,
}: {
  titel?: ReactNode;
  acties?: ReactNode;
  strak?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="kaart">
      {(titel || acties) && (
        <div className="kaart__kop">
          {titel ? <h2 className="kaart__titel">{titel}</h2> : <span />}
          {acties}
        </div>
      )}
      <div className={strak ? 'kaart__lijf kaart__lijf--strak' : 'kaart__lijf'}>{children}</div>
    </section>
  );
}

// --- Kerncijfer ------------------------------------------------------------

export function Kerncijfer({
  label,
  waarde,
  uitleg,
  toon,
}: {
  label: string;
  waarde: string;
  uitleg?: string;
  toon?: 'goed' | 'let-op' | 'neutraal';
}) {
  const uitlegId = useId();
  return (
    <div className="kaart">
      <div className="kerncijfer">
        <span className="kerncijfer__label">{label}</span>
        <strong
          className="kerncijfer__waarde"
          style={toon === 'goed' ? { color: 'var(--kleur-goed)' } : toon === 'let-op' ? { color: 'var(--kleur-let-op)' } : undefined}
          aria-describedby={uitleg ? uitlegId : undefined}
        >
          {waarde}
        </strong>
        {uitleg && (
          <p className="kerncijfer__uitleg" id={uitlegId}>
            {uitleg}
          </p>
        )}
      </div>
    </div>
  );
}

// --- Formuliervelden -------------------------------------------------------

export type VeldProps = {
  label: string;
  uitleg?: string;
  fout?: string;
  verplicht?: boolean;
  children?: ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>;

export const Veld = forwardRef<HTMLInputElement, VeldProps>(function Veld(
  { label, uitleg, fout, verplicht, children, ...rest },
  ref,
) {
  const id = useId();
  const uitlegId = `${id}-uitleg`;
  const foutId = `${id}-fout`;
  const beschrijving = [uitleg ? uitlegId : null, fout ? foutId : null].filter(Boolean).join(' ');

  return (
    <div className="veld">
      <label className="veld__label" htmlFor={id}>
        {label}
        {verplicht && <span aria-hidden="true"> *</span>}
      </label>
      {children ?? (
        <input
          {...rest}
          id={id}
          ref={ref}
          className="veld__invoer"
          required={verplicht}
          aria-invalid={fout ? true : undefined}
          aria-describedby={beschrijving || undefined}
        />
      )}
      {uitleg && (
        <span className="veld__uitleg" id={uitlegId}>
          {uitleg}
        </span>
      )}
      {fout && (
        <span className="veld__fout" id={foutId} role="alert">
          {fout}
        </span>
      )}
    </div>
  );
});

export function Keuzeveld({
  label,
  uitleg,
  fout,
  verplicht,
  opties,
  ...rest
}: {
  label: string;
  uitleg?: string;
  fout?: string;
  verplicht?: boolean;
  opties: { waarde: string; tekst: string }[];
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'>) {
  const id = useId();
  const uitlegId = `${id}-uitleg`;
  const foutId = `${id}-fout`;
  return (
    <div className="veld">
      <label className="veld__label" htmlFor={id}>
        {label}
        {verplicht && <span aria-hidden="true"> *</span>}
      </label>
      <select
        {...rest}
        id={id}
        className="veld__invoer"
        aria-invalid={fout ? true : undefined}
        aria-describedby={[uitleg ? uitlegId : null, fout ? foutId : null].filter(Boolean).join(' ') || undefined}
      >
        {opties.map((optie) => (
          <option key={optie.waarde} value={optie.waarde}>
            {optie.tekst}
          </option>
        ))}
      </select>
      {uitleg && (
        <span className="veld__uitleg" id={uitlegId}>
          {uitleg}
        </span>
      )}
      {fout && (
        <span className="veld__fout" id={foutId} role="alert">
          {fout}
        </span>
      )}
    </div>
  );
}

export function Tekstveld({
  label,
  uitleg,
  ...rest
}: { label: string; uitleg?: string } & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>) {
  const id = useId();
  const uitlegId = `${id}-uitleg`;
  return (
    <div className="veld">
      <label className="veld__label" htmlFor={id}>
        {label}
      </label>
      <textarea {...rest} id={id} className="veld__invoer" aria-describedby={uitleg ? uitlegId : undefined} />
      {uitleg && (
        <span className="veld__uitleg" id={uitlegId}>
          {uitleg}
        </span>
      )}
    </div>
  );
}

// --- Melding ---------------------------------------------------------------

export type MeldingSoort = 'info' | 'goed' | 'let-op' | 'fout';

const TEKENS: Record<MeldingSoort, string> = { info: 'i', goed: '✓', 'let-op': '!', fout: '✕' };

export function Melding({
  soort = 'info',
  titel,
  children,
  actie,
}: {
  soort?: MeldingSoort;
  titel?: string;
  children?: ReactNode;
  actie?: ReactNode;
}) {
  return (
    <div className={`melding melding--${soort}`} role={soort === 'fout' ? 'alert' : 'status'}>
      <span className="melding__teken" aria-hidden="true">
        {TEKENS[soort]}
      </span>
      <div className="melding__inhoud">
        {titel && <p className="melding__titel">{titel}</p>}
        {children && <div className="melding__tekst">{children}</div>}
      </div>
      {actie}
    </div>
  );
}

// --- Etiket ----------------------------------------------------------------

export function Etiket({
  soort = 'neutraal',
  children,
}: {
  soort?: 'neutraal' | 'goed' | 'let-op' | 'fout' | 'info';
  children: ReactNode;
}) {
  return <span className={`etiket etiket--${soort}`}>{children}</span>;
}

// --- Tabel -----------------------------------------------------------------

export function Tabelomhulsel({ children, bijschrift }: { children: ReactNode; bijschrift?: string }) {
  return (
    <div className="tabelomhulsel" tabIndex={0} role="group" aria-label={bijschrift}>
      {children}
    </div>
  );
}

// --- Toestanden ------------------------------------------------------------

export function Laden({ tekst }: { tekst: string }) {
  return (
    <div role="status" aria-live="polite">
      <div className="laadbalk" />
      <span className="alleen-schermlezer">{tekst}</span>
    </div>
  );
}

export function Leegstaat({
  titel,
  uitleg,
  actie,
}: {
  titel: string;
  uitleg?: string;
  actie?: ReactNode;
}) {
  return (
    <div className="leegstaat">
      <p className="leegstaat__titel">{titel}</p>
      {uitleg && <p className="uitleg">{uitleg}</p>}
      {actie}
    </div>
  );
}

// --- Dialoog ---------------------------------------------------------------

export function Dialoog({
  open,
  titel,
  onSluiten,
  voet,
  children,
}: {
  open: boolean;
  titel: string;
  onSluiten: () => void;
  voet?: ReactNode;
  children: ReactNode;
}) {
  const dialoog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialoog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog className="dialoog" ref={dialoog} onCancel={onSluiten} onClose={onSluiten} aria-label={titel}>
      <div className="dialoog__kop">
        <h2>{titel}</h2>
      </div>
      <div className="dialoog__lijf">{children}</div>
      {voet && <div className="dialoog__voet">{voet}</div>}
    </dialog>
  );
}
