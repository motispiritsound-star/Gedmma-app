import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { pendingDeletion } from "@/modules/privacy";
import { env } from "@/lib/env";
import { cancelDeletionAction, requestDeletionAction } from "@/server-actions/account";
import { Card, ErrorNote, SectionHeading, StatusNote } from "@/components/ui/primitives";
import { Field, TextArea, TextInput } from "@/components/ui/form";

export const metadata: Metadata = { title: "Privacy en gegevens" };
export const dynamic = "force-dynamic";

export default async function PrivacySettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireFamily();
  const { t } = await getTranslator();

  const deletion = await pendingDeletion(user.id);
  const graceDays = env().RETENTION_DELETION_GRACE_DAYS;

  return (
    <div className="q-container max-w-2xl py-8">
      <Link href="/settings" className="q-btn q-btn--ghost mb-4 px-3 py-1.5 text-sm">
        ← {t("settings.title")}
      </Link>
      <SectionHeading level={1} title={t("settings.privacy")} />

      {params.cancelled === "1" ? <StatusNote>{t("settings.saved")}</StatusNote> : null}

      <Card as="section" className="mt-4 p-5">
        <h2 className="text-lg">{t("settings.export")}</h2>
        <p className="mt-1 text-[var(--color-ink-soft)]">{t("settings.exportHint")}</p>
        <a href="/api/family/export" className="q-btn q-btn--secondary mt-4" download>
          <span aria-hidden="true">⬇</span>
          {t("settings.export")}
        </a>
      </Card>

      <Card as="section" className="mt-5 p-5">
        <h2 className="text-lg">{t("settings.delete")}</h2>
        <p className="mt-1 text-[var(--color-ink-soft)]">{t("settings.deleteHint", { days: graceDays })}</p>

        {deletion ? (
          <div className="mt-4">
            <p className="q-badge q-badge--warning px-3 py-2">
              {t("settings.deleteScheduled", { date: deletion.scheduledPurgeAt.toISOString().slice(0, 10) })}
            </p>
            <form action={cancelDeletionAction} className="mt-4">
              <button type="submit" className="q-btn q-btn--secondary">
                {t("settings.deleteCancel")}
              </button>
            </form>
          </div>
        ) : (
          <form action={requestDeletionAction} className="mt-4">
            {params.error === "confirm" ? <ErrorNote>{t("settings.deleteConfirm")}</ErrorNote> : null}

            <Field label={t("common.optional")} htmlFor="reason">
              <TextArea id="reason" name="reason" rows={2} maxLength={500} />
            </Field>

            <Field label={t("settings.deleteConfirm")} htmlFor="confirm" required>
              <TextInput id="confirm" name="confirm" required autoComplete="off" placeholder="VERWIJDEREN / DELETE" />
            </Field>

            <button type="submit" className="q-btn q-btn--danger">
              {t("settings.delete")}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
