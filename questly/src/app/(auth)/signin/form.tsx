"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { signInAction } from "@/server-actions/auth";
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

export function SignInForm({ locale }: { locale: AppLocale }) {
  const [state, action] = useActionState(signInAction, null);
  // The translator is a function, which cannot cross the server/client
  // boundary; the locale can, so the dictionary is bound here instead.
  const t = useMemo(() => createTranslator(locale), [locale]);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} noValidate>
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <Field label={t("auth.email")} htmlFor="email" required error={errors.email?.[0]}>
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.[0]}
        />
      </Field>

      <Field label={t("auth.password")} htmlFor="password" required error={errors.password?.[0]}>
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password?.[0]}
        />
      </Field>

      <Submit label={t("auth.signIn.submit")} />
    </form>
  );
}
