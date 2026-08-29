import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireRole } from "@/modules/auth";
import { AUDIT_ACTIONS, listAuditLogs, recordAudit } from "@/modules/audit";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Auditlog", robots: { index: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const admin = await requireRole("PLATFORM_ADMIN");
  const { t } = await getTranslator();

  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);
  const action = typeof params.action === "string" && params.action ? params.action : undefined;
  const { items, total } = await listAuditLogs({ skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, action });

  await recordAudit({
    action: AUDIT_ACTIONS.adminViewedAuditLog,
    targetType: "audit_log",
    actorUserId: admin.id,
    actorRole: admin.role,
  });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="q-container py-8">
      <SectionHeading level={1} title={t("admin.audit")} description={`${total}`} />

      <Card className="mb-5 p-4">
        <form method="get" action="/admin/audit" className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label className="q-label" htmlFor="action">
              Actie
            </label>
            <select id="action" name="action" defaultValue={action ?? ""} className="q-field">
              <option value="">{t("common.all")}</option>
              {Object.values(AUDIT_ACTIONS).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="q-btn q-btn--secondary">
            {t("quests.filter.apply")}
          </button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[48rem] border-collapse text-left">
          <caption className="q-visually-hidden">{t("admin.audit")}</caption>
          <thead>
            <tr className="border-b-2 border-[var(--color-line-strong)]">
              <th scope="col" className="p-3">Tijd</th>
              <th scope="col" className="p-3">Actie</th>
              <th scope="col" className="p-3">Doel</th>
              <th scope="col" className="p-3">Actor</th>
            </tr>
          </thead>
          <tbody>
            {items.map((entry) => (
              <tr key={entry.id} className="border-b border-[var(--color-line)]">
                <td className="p-3">
                  <time dateTime={entry.createdAt.toISOString()}>
                    {entry.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                  </time>
                </td>
                <td className="p-3">
                  <Badge tone={entry.action.includes("failed") ? "warning" : "neutral"}>{entry.action}</Badge>
                </td>
                <td className="p-3 text-sm">
                  {entry.targetType}
                  {entry.targetId ? <span className="text-[var(--color-ink-faint)]"> · {entry.targetId}</span> : null}
                </td>
                <td className="p-3 text-sm">{entry.actor?.displayName ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <nav aria-label="Paginering" className="mt-4 flex gap-2">
        {page > 1 ? (
          <a href={`/admin/audit?page=${page - 1}${action ? `&action=${action}` : ""}`} className="q-btn q-btn--secondary">
            ←
          </a>
        ) : null}
        <span className="q-badge q-badge--neutral">
          {page} / {pages}
        </span>
        {page < pages ? (
          <a href={`/admin/audit?page=${page + 1}${action ? `&action=${action}` : ""}`} className="q-btn q-btn--secondary">
            →
          </a>
        ) : null}
      </nav>
    </div>
  );
}
