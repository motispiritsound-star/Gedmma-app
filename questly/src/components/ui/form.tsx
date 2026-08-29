import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="q-label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="ml-1 text-[var(--color-danger)]" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p className="q-hint" id={`${htmlFor}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="q-error" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  id,
  hint,
  error,
  ...props
}: ComponentPropsWithoutRef<"input"> & { id: string; hint?: string; error?: string }) {
  return (
    <input
      {...props}
      id={id}
      className={`q-field ${props.className ?? ""}`.trim()}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined}
    />
  );
}

export function TextArea({
  id,
  hint,
  error,
  ...props
}: ComponentPropsWithoutRef<"textarea"> & { id: string; hint?: string; error?: string }) {
  return (
    <textarea
      {...props}
      id={id}
      className={`q-field ${props.className ?? ""}`.trim()}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined}
    />
  );
}

export function Select({
  id,
  hint,
  error,
  children,
  ...props
}: ComponentPropsWithoutRef<"select"> & { id: string; hint?: string; error?: string }) {
  return (
    <select
      {...props}
      id={id}
      className={`q-field ${props.className ?? ""}`.trim()}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined}
    >
      {children}
    </select>
  );
}

/** A checkbox/radio pill group rendered as a real fieldset for screen readers. */
export function ChoiceGroup({
  legend,
  hint,
  children,
  columns = false,
}: {
  legend: string;
  hint?: string;
  children: ReactNode;
  columns?: boolean;
}) {
  return (
    <fieldset className="mb-5 border-0 p-0">
      <legend className="q-label">{legend}</legend>
      {hint ? <p className="q-hint mb-2">{hint}</p> : null}
      <div className={columns ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2"}>{children}</div>
    </fieldset>
  );
}

export function Choice({
  name,
  value,
  label,
  type = "checkbox",
  defaultChecked,
  emoji,
}: {
  name: string;
  value: string;
  label: string;
  type?: "checkbox" | "radio";
  defaultChecked?: boolean;
  emoji?: string;
}) {
  return (
    <label className="q-choice">
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} className="size-4 accent-[var(--color-brand)]" />
      {emoji ? <span aria-hidden="true">{emoji}</span> : null}
      <span>{label}</span>
    </label>
  );
}
