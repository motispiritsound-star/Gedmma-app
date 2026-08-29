import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { getFamily, getPreference } from "@/modules/families";
import { listChildren } from "@/modules/children";
import { listInterests, listMaterials } from "@/modules/quests/service";
import { updateEnvironmentAction } from "@/server-actions/family";
import { Card, ErrorNote } from "@/components/ui/primitives";
import { Choice, ChoiceGroup, Field, TextInput } from "@/components/ui/form";
import { ChildProfileForm } from "@/components/forms/child-profile-form";
import { PreferenceForm } from "@/components/forms/preference-form";

export const metadata: Metadata = { title: "Onboarding" };
export const dynamic = "force-dynamic";

const STEPS = ["family", "child", "preferences"] as const;
type Step = (typeof STEPS)[number];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireFamily();
  const { locale, t } = await getTranslator();

  const requested = typeof params.step === "string" ? params.step : "family";
  const step: Step = STEPS.includes(requested as Step) ? (requested as Step) : "family";
  const stepIndex = STEPS.indexOf(step) + 1;

  const [family, children, interests, materials, preference] = await Promise.all([
    getFamily(user.familyId),
    listChildren(user.familyId),
    listInterests(locale),
    listMaterials(locale),
    getPreference(user.familyId),
  ]);

  if (!user.emailVerified) redirect("/verify");

  return (
    <div className="q-container max-w-2xl py-8">
      <p className="q-badge q-badge--brand">{t("onboarding.step", { current: stepIndex, total: STEPS.length })}</p>
      <h1 className="mt-3 text-3xl">{t("onboarding.title")}</h1>

      <ol className="mt-4 flex flex-wrap gap-2" aria-label={t("onboarding.title")}>
        {STEPS.map((entry, index) => (
          <li key={entry}>
            <span
              className={`q-badge ${index + 1 <= stepIndex ? "q-badge--brand" : "q-badge--neutral"}`}
              aria-current={entry === step ? "step" : undefined}
            >
              {index + 1}. {entry === "family" ? t("onboarding.family.title") : entry === "child" ? t("onboarding.child.title") : t("onboarding.preferences.title")}
            </span>
          </li>
        ))}
      </ol>

      <Card className="mt-6 p-6">
        {step === "family" ? (
          <form action={updateEnvironmentAction}>
            <h2 className="mb-4 text-xl">{t("onboarding.family.title")}</h2>
            {params.error === "1" ? <ErrorNote>{t("common.error")}</ErrorNote> : null}

            <Field label={t("auth.familyName")} htmlFor="name" required>
              <TextInput id="name" name="name" defaultValue={family.name} required autoComplete="off" />
            </Field>

            <input type="hidden" name="locale" value={locale} />

            <ChoiceGroup legend={t("onboarding.family.environment")} hint={t("onboarding.family.environmentHint")}>
              {(["CITY", "SUBURB", "RURAL"] as const).map((environment) => (
                <Choice
                  key={environment}
                  type="radio"
                  name="environment"
                  value={environment}
                  label={t(`environment.${environment}`)}
                  defaultChecked={family.environment === environment}
                />
              ))}
            </ChoiceGroup>

            <label className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-sunk)] p-3">
              <input
                type="checkbox"
                name="requireParentApproval"
                defaultChecked={family.requireParentApproval}
                className="mt-1 size-4 accent-[var(--color-brand)]"
              />
              <span className="text-sm">
                <span className="block font-semibold">{t("settings.approval")}</span>
                <span className="text-[var(--color-ink-soft)]">{t("settings.approvalHint")}</span>
              </span>
            </label>

            <button type="submit" className="q-btn q-btn--primary">
              {t("common.next")}
            </button>
          </form>
        ) : null}

        {step === "child" ? (
          <>
            <h2 className="mb-1 text-xl">{t("onboarding.child.title")}</h2>
            {children.length > 0 ? (
              <p className="mb-4 text-[var(--color-ink-soft)]">
                {children.map((child) => child.nickname).join(", ")}
              </p>
            ) : null}
            <ChildProfileForm
              locale={locale}
              mode="create"
              interests={interests}
              redirectTo="/onboarding?step=preferences"
            />
            {children.length > 0 ? (
              <Link href="/onboarding?step=preferences" className="q-btn q-btn--ghost mt-4">
                {t("common.next")}
              </Link>
            ) : null}
          </>
        ) : null}

        {step === "preferences" ? (
          <>
            <h2 className="mb-4 text-xl">{t("onboarding.preferences.title")}</h2>
            <PreferenceForm
              locale={locale}
              materials={materials}
              finishOnboarding
              defaults={{
                preferredDurationMinutes: preference.preferredDurationMinutes,
                preferredDifficulty: preference.preferredDifficulty,
                settingPreference: preference.settingPreference,
                participationStyle: preference.participationStyle,
                availableMaterialSlugs: preference.availableMaterialSlugs,
              }}
            />
          </>
        ) : null}
      </Card>
    </div>
  );
}
