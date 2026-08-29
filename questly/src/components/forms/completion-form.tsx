"use client";

import { useActionState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { submitCompletionAction } from "@/server-actions/quests";
import { Choice, ChoiceGroup, Field, TextArea, TextInput } from "@/components/ui/form";
import { ErrorNote } from "@/components/ui/primitives";
import { createTranslator, type AppLocale } from "@/modules/i18n";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="q-btn q-btn--accent w-full sm:w-auto" disabled={pending} aria-busy={pending}>
      {label}
    </button>
  );
}

export function CompletionForm({
  locale,
  completionId,
  childProfiles,
  reflectionQuestions,
  requiresApproval,
  defaultMinutes,
}: {
  locale: AppLocale;
  completionId: string;
  childProfiles: { id: string; nickname: string }[];
  reflectionQuestions: { id: string; text: string }[];
  requiresApproval: boolean;
  defaultMinutes: number;
}) {
  const [state, action] = useActionState(submitCompletionAction, null);
  // The translator is a function, which cannot cross the server/client
  // boundary; the locale can, so the dictionary is bound here instead.
  const t = useMemo(() => createTranslator(locale), [locale]);

  return (
    <form action={action} noValidate encType="multipart/form-data">
      <input type="hidden" name="completionId" value={completionId} />
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <ChoiceGroup legend={t("completion.participants")}>
        {childProfiles.length === 0 ? <p>{t("children.empty")}</p> : null}
        {childProfiles.map((child, index) => (
          <Choice
            key={child.id}
            name="childProfileIds"
            value={child.id}
            label={child.nickname}
            defaultChecked={index === 0}
          />
        ))}
      </ChoiceGroup>

      <Field label={t("completion.minutes")} htmlFor="minutesSpent" required>
        <TextInput
          id="minutesSpent"
          name="minutesSpent"
          type="number"
          min={0}
          max={1440}
          defaultValue={defaultMinutes}
          required
        />
      </Field>

      {reflectionQuestions.map((question, index) => (
        <div key={question.id}>
          <input type="hidden" name="reflectionQuestionId" value={question.id} />
          <input type="hidden" name="reflectionPrompt" value={question.text} />
          <Field label={question.text} htmlFor={`reflection-${index}`}>
            <TextArea id={`reflection-${index}`} name="reflectionAnswer" rows={3} maxLength={2000} />
          </Field>
        </div>
      ))}

      <Field label={t("completion.note")} htmlFor="familyNote" hint={t("completion.noteHint")}>
        <TextArea id="familyNote" name="familyNote" rows={3} maxLength={2000} hint={t("completion.noteHint")} />
      </Field>

      <Field label={t("completion.evidence")} htmlFor="evidence" hint={t("completion.evidenceHint")}>
        <input
          id="evidence"
          name="evidence"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="q-field h-auto py-2"
          aria-describedby="evidence-hint"
        />
      </Field>

      <Submit label={requiresApproval ? t("completion.submitForApproval") : t("completion.submit")} />
    </form>
  );
}
