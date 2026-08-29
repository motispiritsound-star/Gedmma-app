import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { confirmMockUpgradeAction } from "@/server-actions/account";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Bevestigen", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Return page for the mock checkout. It never activates anything on its own:
 * the parent has to press the button, so a stray GET cannot change a plan.
 */
export default async function ConfirmUpgradePage() {
  await requireFamily();
  const { t } = await getTranslator();

  return (
    <div className="q-container max-w-lg py-12">
      <Card className="p-6 text-center">
        <p className="text-3xl" aria-hidden="true">
          🧾
        </p>
        <h1 className="mt-2 text-2xl">{t("subscription.upgrade")}</h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">{t("subscription.mockNotice")}</p>
        <form action={confirmMockUpgradeAction} className="mt-6">
          <button type="submit" className="q-btn q-btn--accent w-full">
            {t("subscription.upgrade")}
          </button>
        </form>
      </Card>
    </div>
  );
}
