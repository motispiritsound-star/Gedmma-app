import type { ReactNode } from 'react';

/**
 * Small accessible primitives. Deliberately unclever: no headless-UI
 * dependency, no portals, nothing that breaks without JavaScript. Everything
 * that matters on a parent screen works with the keyboard alone.
 */

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[var(--color-ink-soft)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return <Tag className={`wb-card p-5 ${className}`}>{children}</Tag>;
}

export function Field({
  label,
  name,
  children,
  hint,
  error,
}: {
  label: string;
  name: string;
  children: ReactNode;
  hint?: string;
  error?: string;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  return (
    <div className="mb-4">
      <label className="wb-label" htmlFor={name}>
        {label}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-[var(--color-ink-soft)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-[var(--color-warn-ink)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Tint plus its measured ink. See the note in globals.css about contrast. */
const BADGE_TONES = {
  neutral: 'bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]',
  ok: 'bg-[var(--color-ok-tint)] text-[var(--color-ok-ink)]',
  warn: 'bg-[var(--color-warn-tint)] text-[var(--color-warn-ink)]',
  caution: 'bg-[var(--color-caution-tint)] text-[var(--color-caution-ink)]',
  muted: 'bg-[var(--color-muted-tint)] text-[var(--color-muted-ink)]',
} as const;

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE_TONES;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function Notice({
  tone = 'neutral',
  title,
  children,
}: {
  tone?: 'neutral' | 'warn' | 'ok';
  title?: string;
  children: ReactNode;
}) {
  const border =
    tone === 'warn'
      ? 'border-[var(--color-warn)]'
      : tone === 'ok'
        ? 'border-[var(--color-ok)]'
        : 'border-[var(--color-line)]';
  return (
    <div
      role={tone === 'warn' ? 'alert' : 'status'}
      className={`mb-4 rounded-lg border-s-4 ${border} bg-[var(--color-card)] p-4`}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className="text-sm text-[var(--color-ink-soft)]">{children}</div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-center text-[var(--color-ink-soft)]">
      {children}
    </p>
  );
}

export function DataTable({
  caption,
  head,
  children,
}: {
  caption: string;
  head: readonly string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only-focusable absolute">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--color-line)] text-start">
            {head.map((cell) => (
              <th key={cell} scope="col" className="px-3 py-2 text-start font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
