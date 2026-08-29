import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "q-btn q-btn--primary",
  accent: "q-btn q-btn--accent",
  secondary: "q-btn q-btn--secondary",
  ghost: "q-btn q-btn--ghost",
  danger: "q-btn q-btn--danger",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant }) {
  return <button {...props} className={`${VARIANT_CLASS[variant]} ${className}`.trim()} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={`${VARIANT_CLASS[variant]} ${className}`.trim()} />;
}

type Tone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger";

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={`q-badge q-badge--${tone} ${className}`.trim()}>{children}</span>;
}

export function Card({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: "div" | "section" | "article" | "li";
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={`q-card ${className}`.trim()}>{children}</Tag>;
}

export function SectionHeading({
  title,
  description,
  action,
  level = 2,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  level?: 1 | 2 | 3;
}) {
  const Tag = (`h${level}` as const);
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Tag className={level === 1 ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}>{title}</Tag>
        {description ? <p className="mt-1 max-w-2xl text-[var(--color-ink-soft)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="q-card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span aria-hidden="true" className="text-3xl">
        🧭
      </span>
      <p className="font-display text-lg font-semibold text-[var(--color-brand-ink)]">{title}</p>
      {description ? <p className="max-w-md text-[var(--color-ink-soft)]">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorNote({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} role="alert" className="q-error">
      {children}
    </p>
  );
}

/** Non-blocking status message. `polite` so it does not interrupt a screen reader. */
export function StatusNote({ children, tone = "success" }: { children: ReactNode; tone?: Tone }) {
  return (
    <p
      role="status"
      className={`q-badge q-badge--${tone} w-full justify-start px-4 py-2 text-sm sm:w-auto`}
    >
      {children}
    </p>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`q-skeleton ${className}`.trim()} />;
}
