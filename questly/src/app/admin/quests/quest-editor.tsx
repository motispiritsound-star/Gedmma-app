"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createQuestAction, updateQuestAction } from "@/server-actions/admin";
import { Choice, ChoiceGroup, Field, Select, TextArea, TextInput } from "@/components/ui/form";
import { Card, ErrorNote, StatusNote } from "@/components/ui/primitives";
import { createTranslator, type AppLocale } from "@/modules/i18n";

export type StepDraft = {
  durationMinutes: string;
  requiresParent: boolean;
  nlTitle: string;
  nlBody: string;
  nlTip: string;
  enTitle: string;
  enBody: string;
  enTip: string;
};

export type SafetyDraft = { severity: "INFO" | "WARNING" | "CRITICAL"; textNl: string; textEn: string };
export type ReflectionDraft = { textNl: string; textEn: string };

export type QuestDraft = {
  id?: string;
  slug: string;
  categorySlug: string;
  ageBands: string[];
  seasons: string[];
  durationMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "CHALLENGING";
  setting: "INDOOR" | "OUTDOOR" | "BOTH";
  weather: "ANY" | "DRY" | "RAIN_FRIENDLY" | "WARM" | "COLD";
  minParticipants: number;
  maxParticipants: number;
  isPremium: boolean;
  requiresAdultSupervision: boolean;
  safetyLevel: "INFO" | "WARNING" | "CRITICAL";
  imageKey: string;
  skillSlugs: string[];
  materialSlugs: string[];
  nl: { title: string; summary: string; story: string; objective: string; result: string; preparation: string; audio: string };
  en: { title: string; summary: string; story: string; objective: string; result: string; preparation: string; audio: string };
  steps: StepDraft[];
  safety: SafetyDraft[];
  reflections: ReflectionDraft[];
};

export const EMPTY_STEP: StepDraft = {
  durationMinutes: "",
  requiresParent: false,
  nlTitle: "",
  nlBody: "",
  nlTip: "",
  enTitle: "",
  enBody: "",
  enTip: "",
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="q-btn q-btn--primary" disabled={pending} aria-busy={pending}>
      {label}
    </button>
  );
}

export function QuestEditor({
  locale,
  mode,
  draft,
  categories,
  skills,
  materials,
}: {
  locale: AppLocale;
  mode: "create" | "edit";
  draft: QuestDraft;
  categories: { slug: string; name: string }[];
  skills: { slug: string; name: string }[];
  materials: { slug: string; name: string }[];
}) {
  const [state, action] = useActionState(mode === "create" ? createQuestAction : updateQuestAction, null);
  // The translator is a function, which cannot cross the server/client
  // boundary; the locale can, so the dictionary is bound here instead.
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [steps, setSteps] = useState<StepDraft[]>(draft.steps.length > 0 ? draft.steps : [EMPTY_STEP]);
  const [safety, setSafety] = useState<SafetyDraft[]>(draft.safety);
  const [reflections, setReflections] = useState<ReflectionDraft[]>(
    draft.reflections.length > 0 ? draft.reflections : [{ textNl: "", textEn: "" }],
  );
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} noValidate className="space-y-5">
      {draft.id ? <input type="hidden" name="questId" value={draft.id} /> : null}

      {state && !state.ok ? (
        <div>
          <ErrorNote>{state.error}</ErrorNote>
          <ul className="q-error list-disc pl-5">
            {Object.entries(errors).map(([key, messages]) => (
              <li key={key}>
                {key}: {messages.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {state?.ok ? <StatusNote>{t("settings.saved")}</StatusNote> : null}

      <Card as="section" className="p-5">
        <h2 className="mb-4 text-xl">{t("admin.quest.edit")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug" htmlFor="slug" required error={errors.slug?.[0]}>
            <TextInput id="slug" name="slug" defaultValue={draft.slug} required pattern="[a-z0-9-]+" error={errors.slug?.[0]} />
          </Field>
          <Field label={t("quest.category")} htmlFor="categorySlug" required>
            <Select id="categorySlug" name="categorySlug" defaultValue={draft.categorySlug} required>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("quest.duration")} htmlFor="durationMinutes" required>
            <TextInput id="durationMinutes" name="durationMinutes" type="number" min={10} max={480} defaultValue={draft.durationMinutes} required />
          </Field>
          <Field label={t("quest.difficulty")} htmlFor="difficulty" required>
            <Select id="difficulty" name="difficulty" defaultValue={draft.difficulty}>
              {(["EASY", "MEDIUM", "CHALLENGING"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`difficulty.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("quest.setting")} htmlFor="setting" required>
            <Select id="setting" name="setting" defaultValue={draft.setting}>
              {(["INDOOR", "OUTDOOR", "BOTH"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`setting.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("quests.filter.weather")} htmlFor="weather">
            <Select id="weather" name="weather" defaultValue={draft.weather}>
              {(["ANY", "DRY", "RAIN_FRIENDLY", "WARM", "COLD"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`weather.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Min." htmlFor="minParticipants" required>
            <TextInput id="minParticipants" name="minParticipants" type="number" min={1} max={20} defaultValue={draft.minParticipants} required />
          </Field>
          <Field label="Max." htmlFor="maxParticipants" required error={errors.maxParticipants?.[0]}>
            <TextInput id="maxParticipants" name="maxParticipants" type="number" min={1} max={40} defaultValue={draft.maxParticipants} required error={errors.maxParticipants?.[0]} />
          </Field>
          <Field label={t("quest.safety")} htmlFor="safetyLevel">
            <Select id="safetyLevel" name="safetyLevel" defaultValue={draft.safetyLevel}>
              {(["INFO", "WARNING", "CRITICAL"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`safety.${value}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Image key" htmlFor="imageKey">
            <TextInput id="imageKey" name="imageKey" defaultValue={draft.imageKey} />
          </Field>
        </div>

        <ChoiceGroup legend={t("quests.filter.ageBand")}>
          {(["AGE_6_8", "AGE_9_11", "AGE_12_15"] as const).map((band) => (
            <Choice key={band} name="ageBands" value={band} label={t(`ageBand.${band}`)} defaultChecked={draft.ageBands.includes(band)} />
          ))}
        </ChoiceGroup>
        {errors.ageBands ? <ErrorNote>{errors.ageBands[0]}</ErrorNote> : null}

        <ChoiceGroup legend="Seizoen">
          {(["SPRING", "SUMMER", "AUTUMN", "WINTER"] as const).map((season) => (
            <Choice key={season} name="seasons" value={season} label={t(`season.${season}`)} defaultChecked={draft.seasons.includes(season)} />
          ))}
        </ChoiceGroup>

        <ChoiceGroup legend={t("quest.skills")}>
          {skills.map((skill) => (
            <Choice key={skill.slug} name="skillSlugs" value={skill.slug} label={skill.name} defaultChecked={draft.skillSlugs.includes(skill.slug)} />
          ))}
        </ChoiceGroup>

        <ChoiceGroup legend={t("quest.materials")} columns>
          {materials.map((material) => (
            <Choice key={material.slug} name="materialSlugs" value={material.slug} label={material.name} defaultChecked={draft.materialSlugs.includes(material.slug)} />
          ))}
        </ChoiceGroup>

        <div className="flex flex-wrap gap-4">
          <label className="q-choice">
            <input type="checkbox" name="isPremium" defaultChecked={draft.isPremium} className="size-4 accent-[var(--color-brand)]" />
            <span>{t("quest.premium")}</span>
          </label>
          <label className="q-choice">
            <input
              type="checkbox"
              name="requiresAdultSupervision"
              defaultChecked={draft.requiresAdultSupervision}
              className="size-4 accent-[var(--color-brand)]"
            />
            <span>{t("quest.adultSupervision")}</span>
          </label>
        </div>
      </Card>

      {(["nl", "en"] as const).map((language) => (
        <Card as="section" key={language} className="p-5">
          <h2 className="mb-4 text-xl">
            {t("admin.quest.translations")} — {language.toUpperCase()}
          </h2>
          <Field label="Titel" htmlFor={`${language}Title`} required>
            <TextInput id={`${language}Title`} name={`${language}Title`} defaultValue={draft[language].title} required />
          </Field>
          <Field label="Samenvatting" htmlFor={`${language}Summary`} required>
            <TextArea id={`${language}Summary`} name={`${language}Summary`} rows={2} defaultValue={draft[language].summary} required />
          </Field>
          <Field label={t("quest.story")} htmlFor={`${language}Story`} required>
            <TextArea id={`${language}Story`} name={`${language}Story`} rows={4} defaultValue={draft[language].story} required />
          </Field>
          <Field label={t("quest.objective")} htmlFor={`${language}Objective`} required>
            <TextArea id={`${language}Objective`} name={`${language}Objective`} rows={2} defaultValue={draft[language].objective} required />
          </Field>
          <Field label={t("quest.expectedResult")} htmlFor={`${language}Result`} required>
            <TextArea id={`${language}Result`} name={`${language}Result`} rows={2} defaultValue={draft[language].result} required />
          </Field>
          <Field label={t("quest.preparation")} htmlFor={`${language}Preparation`} hint="Een regel per punt">
            <TextArea id={`${language}Preparation`} name={`${language}Preparation`} rows={3} defaultValue={draft[language].preparation} hint="Een regel per punt" />
          </Field>
          <Field label="Audioscript" htmlFor={`${language}Audio`}>
            <TextArea id={`${language}Audio`} name={`${language}Audio`} rows={2} defaultValue={draft[language].audio} />
          </Field>
        </Card>
      ))}

      <Card as="section" className="p-5">
        <h2 className="mb-4 text-xl">{t("admin.quest.steps")}</h2>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={index} className="rounded-xl bg-[var(--color-surface-sunk)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg">#{index + 1}</h3>
                <button
                  type="button"
                  className="q-btn q-btn--ghost px-3 py-1 text-sm"
                  onClick={() => setSteps((rows) => rows.filter((_, i) => i !== index))}
                  disabled={steps.length === 1}
                >
                  {t("common.delete")}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Minuten" htmlFor={`stepDuration-${index}`}>
                  <TextInput id={`stepDuration-${index}`} name="stepDuration" type="number" min={1} max={240} defaultValue={step.durationMinutes} />
                </Field>
                <Field label={t("quest.adultSupervision")} htmlFor={`stepRequiresParent-${index}`}>
                  <Select id={`stepRequiresParent-${index}`} name="stepRequiresParent" defaultValue={step.requiresParent ? "yes" : "no"}>
                    <option value="no">{t("common.no")}</option>
                    <option value="yes">{t("common.yes")}</option>
                  </Select>
                </Field>
                <Field label="Titel NL" htmlFor={`stepNlTitle-${index}`} required>
                  <TextInput id={`stepNlTitle-${index}`} name="stepNlTitle" defaultValue={step.nlTitle} required />
                </Field>
                <Field label="Titel EN" htmlFor={`stepEnTitle-${index}`} required>
                  <TextInput id={`stepEnTitle-${index}`} name="stepEnTitle" defaultValue={step.enTitle} required />
                </Field>
                <Field label="Tekst NL" htmlFor={`stepNlBody-${index}`} required>
                  <TextArea id={`stepNlBody-${index}`} name="stepNlBody" rows={3} defaultValue={step.nlBody} required />
                </Field>
                <Field label="Tekst EN" htmlFor={`stepEnBody-${index}`} required>
                  <TextArea id={`stepEnBody-${index}`} name="stepEnBody" rows={3} defaultValue={step.enBody} required />
                </Field>
                <Field label="Tip NL" htmlFor={`stepNlTip-${index}`}>
                  <TextInput id={`stepNlTip-${index}`} name="stepNlTip" defaultValue={step.nlTip} />
                </Field>
                <Field label="Tip EN" htmlFor={`stepEnTip-${index}`}>
                  <TextInput id={`stepEnTip-${index}`} name="stepEnTip" defaultValue={step.enTip} />
                </Field>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="q-btn q-btn--secondary mt-4" onClick={() => setSteps((rows) => [...rows, { ...EMPTY_STEP }])}>
          + {t("admin.quest.steps")}
        </button>
      </Card>

      <Card as="section" className="p-5">
        <h2 className="mb-4 text-xl">{t("quest.safety")}</h2>
        <ul className="space-y-3">
          {safety.map((entry, index) => (
            <li key={index} className="grid gap-3 rounded-xl bg-[var(--color-surface-sunk)] p-4 sm:grid-cols-[10rem_1fr_1fr_auto]">
              <Field label="Niveau" htmlFor={`safetySeverity-${index}`}>
                <Select id={`safetySeverity-${index}`} name="safetySeverity" defaultValue={entry.severity}>
                  {(["INFO", "WARNING", "CRITICAL"] as const).map((value) => (
                    <option key={value} value={value}>
                      {t(`safety.${value}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="NL" htmlFor={`safetyTextNl-${index}`}>
                <TextInput id={`safetyTextNl-${index}`} name="safetyTextNl" defaultValue={entry.textNl} />
              </Field>
              <Field label="EN" htmlFor={`safetyTextEn-${index}`}>
                <TextInput id={`safetyTextEn-${index}`} name="safetyTextEn" defaultValue={entry.textEn} />
              </Field>
              <button
                type="button"
                className="q-btn q-btn--ghost mb-4 self-end px-3 py-1 text-sm"
                onClick={() => setSafety((rows) => rows.filter((_, i) => i !== index))}
              >
                {t("common.delete")}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="q-btn q-btn--secondary mt-4"
          onClick={() => setSafety((rows) => [...rows, { severity: "INFO", textNl: "", textEn: "" }])}
        >
          + {t("quest.safety")}
        </button>
      </Card>

      <Card as="section" className="p-5">
        <h2 className="mb-4 text-xl">{t("quest.reflection")}</h2>
        <ul className="space-y-3">
          {reflections.map((entry, index) => (
            <li key={index} className="grid gap-3 rounded-xl bg-[var(--color-surface-sunk)] p-4 sm:grid-cols-[1fr_1fr_auto]">
              <Field label="NL" htmlFor={`reflectionTextNl-${index}`} required>
                <TextInput id={`reflectionTextNl-${index}`} name="reflectionTextNl" defaultValue={entry.textNl} required />
              </Field>
              <Field label="EN" htmlFor={`reflectionTextEn-${index}`} required>
                <TextInput id={`reflectionTextEn-${index}`} name="reflectionTextEn" defaultValue={entry.textEn} required />
              </Field>
              <button
                type="button"
                className="q-btn q-btn--ghost mb-4 self-end px-3 py-1 text-sm"
                onClick={() => setReflections((rows) => rows.filter((_, i) => i !== index))}
                disabled={reflections.length === 1}
              >
                {t("common.delete")}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="q-btn q-btn--secondary mt-4"
          onClick={() => setReflections((rows) => [...rows, { textNl: "", textEn: "" }])}
        >
          + {t("quest.reflection")}
        </button>
      </Card>

      <Card as="section" className="p-5">
        <Field label="Wijzigingsnotitie" htmlFor="changeNote" hint="Wordt opgeslagen in de versiegeschiedenis.">
          <TextInput id="changeNote" name="changeNote" maxLength={280} hint="Wordt opgeslagen in de versiegeschiedenis." />
        </Field>
        <Submit label={t("common.save")} />
      </Card>
    </form>
  );
}
