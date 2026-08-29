"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { updatePreferenceAction } from "@/server-actions/family";
import { Choice, ChoiceGroup, Field, Select } from "@/components/ui/form";
import { ErrorNote, StatusNote } from "@/components/ui/primitives";
import { createTranslator, type AppLocale } from "@/modules/i18n";

const DURATIONS = [30, 45, 60, 90, 120] as const;

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="q-btn q-btn--primary" disabled={pending} aria-busy={pending}>
      {label}
    </button>
  );
}

export function PreferenceForm({
  locale,
  materials,
  defaults,
  finishOnboarding = false,
}: {
  locale: AppLocale;
  materials: { slug: string; name: string }[];
  defaults: {
    preferredDurationMinutes: number;
    preferredDifficulty: "EASY" | "MEDIUM" | "CHALLENGING";
    settingPreference: "INDOOR" | "OUTDOOR" | "BOTH";
    participationStyle: "FAMILY" | "INDIVIDUAL" | "BOTH";
    availableMaterialSlugs: string[];
  };
  finishOnboarding?: boolean;
}) {
  const [state, action] = useActionState(updatePreferenceAction, null);
  // The translator is a function, which cannot cross the server/client
  // boundary; the locale can, so the dictionary is bound here instead.
  const t = useMemo(() => createTranslator(locale), [locale]);
  const selected = new Set(defaults.availableMaterialSlugs);

  return (
    <form action={action} noValidate>
      {finishOnboarding ? <input type="hidden" name="finishOnboarding" value="1" /> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
      {state?.ok ? <StatusNote>{t("settings.saved")}</StatusNote> : null}

      <Field label={t("onboarding.preferences.duration")} htmlFor="preferredDurationMinutes">
        <Select id="preferredDurationMinutes" name="preferredDurationMinutes" defaultValue={defaults.preferredDurationMinutes}>
          {DURATIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {t("quest.minutes", { count: minutes })}
            </option>
          ))}
        </Select>
      </Field>

      <ChoiceGroup legend={t("onboarding.preferences.difficulty")}>
        {(["EASY", "MEDIUM", "CHALLENGING"] as const).map((level) => (
          <Choice
            key={level}
            type="radio"
            name="preferredDifficulty"
            value={level}
            label={t(`difficulty.${level}`)}
            defaultChecked={defaults.preferredDifficulty === level}
          />
        ))}
      </ChoiceGroup>

      <ChoiceGroup legend={t("onboarding.preferences.setting")}>
        {(["INDOOR", "OUTDOOR", "BOTH"] as const).map((setting) => (
          <Choice
            key={setting}
            type="radio"
            name="settingPreference"
            value={setting}
            label={t(`setting.${setting}`)}
            defaultChecked={defaults.settingPreference === setting}
          />
        ))}
      </ChoiceGroup>

      <ChoiceGroup legend={t("onboarding.preferences.participation")}>
        {(["FAMILY", "INDIVIDUAL", "BOTH"] as const).map((style) => (
          <Choice
            key={style}
            type="radio"
            name="participationStyle"
            value={style}
            label={t(`participation.${style}`)}
            defaultChecked={defaults.participationStyle === style}
          />
        ))}
      </ChoiceGroup>

      <ChoiceGroup legend={t("onboarding.preferences.materials")} columns>
        {materials.map((material) => (
          <Choice
            key={material.slug}
            name="availableMaterialSlugs"
            value={material.slug}
            label={material.name}
            defaultChecked={selected.has(material.slug)}
          />
        ))}
      </ChoiceGroup>

      <Submit label={finishOnboarding ? t("onboarding.finish") : t("common.save")} />
    </form>
  );
}
