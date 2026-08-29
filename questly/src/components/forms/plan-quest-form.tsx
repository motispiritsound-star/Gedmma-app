"use client";

import { useActionState, useId, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { planQuestAction } from "@/server-actions/quests";
import { Choice, ChoiceGroup, Field, Select, TextInput } from "@/components/ui/form";
import { ErrorNote, StatusNote } from "@/components/ui/primitives";
import { createTranslator, type AppLocale } from "@/modules/i18n";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="q-btn q-btn--primary w-full" disabled={pending} aria-busy={pending}>
      {label}
    </button>
  );
}

export function PlanQuestForm({
  locale,
  questSlug,
  childProfiles,
  enabled,
  defaultDate,
}: {
  locale: AppLocale;
  questSlug: string;
  childProfiles: { id: string; nickname: string }[];
  enabled: boolean;
  defaultDate?: string;
}) {
  const [state, action] = useActionState(planQuestAction, null);
  // The translator is a function, which cannot cross the server/client
  // boundary; the locale can, so the dictionary is bound here instead.
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [open, setOpen] = useState(Boolean(defaultDate));
  const id = useId();

  if (!enabled) {
    return <p className="q-badge q-badge--accent w-full justify-start px-3 py-2">{t("planner.premiumOnly")}</p>;
  }

  return (
    <div>
      <button
        type="button"
        className="q-btn q-btn--secondary w-full"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((value) => !value)}
      >
        {t("quest.plan")}
      </button>

      <div id={`${id}-panel`} hidden={!open} className="mt-3">
        <form action={action} noValidate>
          <input type="hidden" name="questSlug" value={questSlug} />
          {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
          {state?.ok ? <StatusNote>{t("settings.saved")}</StatusNote> : null}

          <Field label={t("planner.add")} htmlFor={`${id}-date`} required>
            <TextInput
              id={`${id}-date`}
              name="scheduledFor"
              type="date"
              required
              defaultValue={defaultDate ?? new Date().toISOString().slice(0, 10)}
            />
          </Field>

          <Field label={t("planner.week", { date: "" })} htmlFor={`${id}-time`}>
            <Select id={`${id}-time`} name="timeOfDay" defaultValue="AFTERNOON">
              <option value="MORNING">08:00 – 12:00</option>
              <option value="AFTERNOON">12:00 – 18:00</option>
              <option value="EVENING">18:00 – 21:00</option>
            </Select>
          </Field>

          {childProfiles.length > 0 ? (
            <ChoiceGroup legend={t("completion.participants")}>
              {childProfiles.map((child) => (
                <Choice key={child.id} name="childProfileIds" value={child.id} label={child.nickname} />
              ))}
            </ChoiceGroup>
          ) : null}

          <Submit label={t("planner.add")} />
        </form>
      </div>
    </div>
  );
}
