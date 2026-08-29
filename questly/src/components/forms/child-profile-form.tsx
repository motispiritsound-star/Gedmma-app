"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { createChildAction, updateChildAction } from "@/server-actions/family";
import { Choice, ChoiceGroup, Field, TextInput } from "@/components/ui/form";
import { ErrorNote, StatusNote } from "@/components/ui/primitives";
import { AVATARS } from "@/modules/children/schemas";
import { createTranslator, type AppLocale } from "@/modules/i18n";

const AVATAR_EMOJI: Record<string, string> = {
  fox: "🦊",
  owl: "🦉",
  otter: "🦦",
  bear: "🐻",
  hedgehog: "🦔",
  heron: "🪶",
  beetle: "🐞",
  seal: "🦭",
};

export type InterestOption = { slug: string; name: string; emoji: string };

export type ChildDefaults = {
  id?: string;
  nickname?: string;
  ageBand?: "AGE_6_8" | "AGE_9_11" | "AGE_12_15";
  avatarKey?: string;
  interestSlugs?: string[];
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="q-btn q-btn--primary" disabled={pending} aria-busy={pending}>
      {label}
    </button>
  );
}

export function ChildProfileForm({
  locale,
  interests,
  defaults,
  mode,
  redirectTo,
}: {
  locale: AppLocale;
  interests: InterestOption[];
  defaults?: ChildDefaults;
  mode: "create" | "edit";
  redirectTo?: string;
}) {
  const [state, action] = useActionState(mode === "create" ? createChildAction : updateChildAction, null);
  // The translator is a function, which cannot cross the server/client
  // boundary; the locale can, so the dictionary is bound here instead.
  const t = useMemo(() => createTranslator(locale), [locale]);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const selected = new Set(defaults?.interestSlugs ?? []);
  const idPrefix = defaults?.id ?? "new";

  return (
    <form action={action} noValidate>
      {defaults?.id ? <input type="hidden" name="childId" value={defaults.id} /> : null}
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
      {state?.ok ? <StatusNote>{t("settings.saved")}</StatusNote> : null}

      <Field
        label={t("onboarding.child.nickname")}
        htmlFor={`${idPrefix}-nickname`}
        hint={t("onboarding.child.nicknameHint")}
        required
        error={errors.nickname?.[0]}
      >
        <TextInput
          id={`${idPrefix}-nickname`}
          name="nickname"
          defaultValue={defaults?.nickname}
          maxLength={24}
          required
          autoComplete="off"
          hint={t("onboarding.child.nicknameHint")}
          error={errors.nickname?.[0]}
        />
      </Field>

      <ChoiceGroup legend={t("onboarding.child.ageBand")}>
        {(["AGE_6_8", "AGE_9_11", "AGE_12_15"] as const).map((band) => (
          <Choice
            key={band}
            type="radio"
            name="ageBand"
            value={band}
            label={t(`ageBand.${band}`)}
            defaultChecked={(defaults?.ageBand ?? "AGE_6_8") === band}
          />
        ))}
      </ChoiceGroup>
      {errors.ageBand ? <ErrorNote>{errors.ageBand[0]}</ErrorNote> : null}

      <ChoiceGroup legend={t("onboarding.child.avatar")}>
        {AVATARS.map((avatar) => (
          <Choice
            key={avatar}
            type="radio"
            name="avatarKey"
            value={avatar}
            label={avatar}
            emoji={AVATAR_EMOJI[avatar]}
            defaultChecked={(defaults?.avatarKey ?? "fox") === avatar}
          />
        ))}
      </ChoiceGroup>

      <ChoiceGroup legend={t("onboarding.child.interests")}>
        {interests.map((interest) => (
          <Choice
            key={interest.slug}
            name="interestSlugs"
            value={interest.slug}
            label={interest.name}
            emoji={interest.emoji}
            defaultChecked={selected.has(interest.slug)}
          />
        ))}
      </ChoiceGroup>

      <Submit label={mode === "create" ? t("children.add") : t("common.save")} />
    </form>
  );
}
