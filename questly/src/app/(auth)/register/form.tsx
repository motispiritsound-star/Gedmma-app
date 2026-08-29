"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { registerAction } from "@/server-actions/auth";
import { Field, TextInput } from "@/components/ui/form";
import { ErrorNote } from "@/components/ui/primitives";
import { createTranslator, type AppLocale } from "@/modules/i18n";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="q-btn q-btn--primary w-full" disabled={pending} aria-busy={pending}>
      {label}
    </button>
  );
}

export function RegisterForm({ locale }: { locale: AppLocale }) {
  const [state, action] = useActionState(registerAction, null);
  // The translator is a function, which cannot cross the server/client
  // boundary; the locale can, so the dictionary is bound here instead.
  const t = useMemo(() => createTranslator(locale), [locale]);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} noValidate>
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <Field label={t("auth.displayName")} htmlFor="displayName" required error={errors.displayName?.[0]}>
        <TextInput id="displayName" name="displayName" autoComplete="name" required error={errors.displayName?.[0]} />
      </Field>

      <Field label={t("auth.familyName")} htmlFor="familyName" required error={errors.familyName?.[0]}>
        <TextInput id="familyName" name="familyName" autoComplete="off" required error={errors.familyName?.[0]} />
      </Field>

      <Field label={t("auth.email")} htmlFor="email" required error={errors.email?.[0]}>
        <TextInput id="email" name="email" type="email" autoComplete="email" required error={errors.email?.[0]} />
      </Field>

      <Field
        label={t("auth.password")}
        htmlFor="password"
        hint={t("auth.passwordHint")}
        required
        error={errors.password?.[0]}
      >
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          hint={t("auth.passwordHint")}
          error={errors.password?.[0]}
        />
      </Field>

      <div className="mb-5">
        <label className="flex items-start gap-3 rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-sunk)] p-3">
          <input
            type="checkbox"
            name="consent"
            id="consent"
            value="on"
            required
            className="mt-1 size-4 accent-[var(--color-brand)]"
            aria-describedby={errors.consent ? "consent-error" : undefined}
          />
          <span className="text-sm">{t("auth.consent")}</span>
        </label>
        {errors.consent ? (
          <p className="q-error" id="consent-error" role="alert">
            {t("auth.consentRequired")}
          </p>
        ) : null}
      </div>

      <Submit label={t("auth.register.submit")} />
    </form>
  );
}
