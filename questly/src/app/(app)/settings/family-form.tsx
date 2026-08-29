"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { updateFamilySettingsAction } from "@/server-actions/family";
import { Choice, ChoiceGroup, Field, TextInput } from "@/components/ui/form";
import { ErrorNote, StatusNote } from "@/components/ui/primitives";
import { createTranslator, type AppLocale } from "@/modules/i18n";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="q-btn q-btn--primary" disabled={pending} aria-busy={pending}>
      {label}
    </button>
  );
}

export function FamilySettingsForm({
  locale,
  defaults,
}: {
  locale: AppLocale;
  defaults: {
    name: string;
    locale: "nl" | "en";
    environment: "CITY" | "SUBURB" | "RURAL";
    requireParentApproval: boolean;
  };
}) {
  const [state, action] = useActionState(updateFamilySettingsAction, null);
  // The translator is a function, which cannot cross the server/client
  // boundary; the locale can, so the dictionary is bound here instead.
  const t = useMemo(() => createTranslator(locale), [locale]);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} noValidate>
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
      {state?.ok ? <StatusNote>{t("settings.saved")}</StatusNote> : null}

      <Field label={t("auth.familyName")} htmlFor="familyNameSetting" required error={errors.name?.[0]}>
        <TextInput id="familyNameSetting" name="name" defaultValue={defaults.name} required error={errors.name?.[0]} />
      </Field>

      <ChoiceGroup legend={t("settings.language")}>
        <Choice type="radio" name="locale" value="nl" label="Nederlands" defaultChecked={defaults.locale === "nl"} />
        <Choice type="radio" name="locale" value="en" label="English" defaultChecked={defaults.locale === "en"} />
      </ChoiceGroup>

      <ChoiceGroup legend={t("onboarding.family.environment")} hint={t("onboarding.family.environmentHint")}>
        {(["CITY", "SUBURB", "RURAL"] as const).map((environment) => (
          <Choice
            key={environment}
            type="radio"
            name="environment"
            value={environment}
            label={t(`environment.${environment}`)}
            defaultChecked={defaults.environment === environment}
          />
        ))}
      </ChoiceGroup>

      <label className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-sunk)] p-3">
        <input
          type="checkbox"
          name="requireParentApproval"
          defaultChecked={defaults.requireParentApproval}
          className="mt-1 size-4 accent-[var(--color-brand)]"
        />
        <span className="text-sm">
          <span className="block font-semibold">{t("settings.approval")}</span>
          <span className="text-[var(--color-ink-soft)]">{t("settings.approvalHint")}</span>
        </span>
      </label>

      <Submit label={t("settings.save")} />
    </form>
  );
}
