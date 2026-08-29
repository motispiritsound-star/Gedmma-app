import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { getFamily, getPreference } from "@/modules/families";
import { listMaterials } from "@/modules/quests/service";
import { fromDbLocale } from "@/modules/i18n";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { PreferenceForm } from "@/components/forms/preference-form";
import { FamilySettingsForm } from "./family-form";

export const metadata: Metadata = { title: "Instellingen" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireFamily();
  const { locale, t } = await getTranslator();

  const [family, preference, materials] = await Promise.all([
    getFamily(user.familyId),
    getPreference(user.familyId),
    listMaterials(locale),
  ]);

  return (
    <div className="q-container max-w-3xl py-8">
      <SectionHeading level={1} title={t("settings.title")} />

      <nav aria-label={t("settings.title")} className="mb-6 flex flex-wrap gap-2">
        <Link href="/settings/subscription" className="q-btn q-btn--secondary px-4 py-1.5 text-sm">
          {t("settings.subscription")}
        </Link>
        <Link href="/settings/privacy" className="q-btn q-btn--secondary px-4 py-1.5 text-sm">
          {t("settings.privacy")}
        </Link>
      </nav>

      <Card as="section" className="p-6">
        <h2 className="mb-4 text-xl">{t("settings.family")}</h2>
        <FamilySettingsForm
          locale={locale}
          defaults={{
            name: family.name,
            locale: fromDbLocale(family.locale),
            environment: family.environment,
            requireParentApproval: family.requireParentApproval,
          }}
        />
      </Card>

      <Card as="section" className="mt-6 p-6">
        <h2 className="mb-4 text-xl">{t("onboarding.preferences.title")}</h2>
        <PreferenceForm
          locale={locale}
          materials={materials}
          defaults={{
            preferredDurationMinutes: preference.preferredDurationMinutes,
            preferredDifficulty: preference.preferredDifficulty,
            settingPreference: preference.settingPreference,
            participationStyle: preference.participationStyle,
            availableMaterialSlugs: preference.availableMaterialSlugs,
          }}
        />
      </Card>
    </div>
  );
}
