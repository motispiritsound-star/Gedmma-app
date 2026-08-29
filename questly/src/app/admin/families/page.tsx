import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireRole } from "@/modules/auth";
import { listFamiliesForAdmin, listUsersForAdmin } from "@/modules/admin";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Gezinnen", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminFamiliesPage() {
  const admin = await requireRole("CONTENT_ADMIN", "PLATFORM_ADMIN");
  const { t } = await getTranslator();

  const [families, users] = await Promise.all([listFamiliesForAdmin({ take: 50 }), listUsersForAdmin({ take: 50 })]);

  // Looking at family records is itself a sensitive action, so it is logged.
  await recordAudit({
    action: AUDIT_ACTIONS.adminViewedFamilies,
    targetType: "family",
    actorUserId: admin.id,
    actorRole: admin.role,
    metadata: { count: families.items.length },
  });

  return (
    <div className="q-container py-8">
      <SectionHeading level={1} title={t("admin.families")} description={`${families.total}`} />

      <p className="mb-5 rounded-xl border-l-4 border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-3 text-sm">
        Dit overzicht toont alleen tellingen en abonnementsgegevens. Prive-inhoud van gezinnen (foto&apos;s, notities,
        reflecties) is hier bewust niet opvraagbaar.
      </p>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <caption className="q-visually-hidden">{t("admin.families")}</caption>
          <thead>
            <tr className="border-b-2 border-[var(--color-line-strong)]">
              <th scope="col" className="p-3">Naam</th>
              <th scope="col" className="p-3">Taal</th>
              <th scope="col" className="p-3">Omgeving</th>
              <th scope="col" className="p-3">Abonnement</th>
              <th scope="col" className="p-3 text-right">Kinderen</th>
              <th scope="col" className="p-3 text-right">Quests</th>
              <th scope="col" className="p-3">Aangemaakt</th>
            </tr>
          </thead>
          <tbody>
            {families.items.map((family) => (
              <tr key={family.id} className="border-b border-[var(--color-line)]">
                <td className="p-3 font-semibold">{family.name}</td>
                <td className="p-3">{family.locale}</td>
                <td className="p-3">{t(`environment.${family.environment}`)}</td>
                <td className="p-3">
                  <Badge tone={family.subscription?.plan === "FAMILY_PREMIUM" ? "brand" : "neutral"}>
                    {t(`subscription.plan.${family.subscription?.plan ?? "FREE"}`)}
                  </Badge>
                </td>
                <td className="p-3 text-right tabular-nums">{family._count.children}</td>
                <td className="p-3 text-right tabular-nums">{family._count.completions}</td>
                <td className="p-3">
                  <time dateTime={family.createdAt.toISOString()}>{family.createdAt.toISOString().slice(0, 10)}</time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-3 mt-8 text-xl">Gebruikers</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <caption className="q-visually-hidden">Gebruikers</caption>
          <thead>
            <tr className="border-b-2 border-[var(--color-line-strong)]">
              <th scope="col" className="p-3">Naam</th>
              <th scope="col" className="p-3">E-mail</th>
              <th scope="col" className="p-3">Rol</th>
              <th scope="col" className="p-3">Bevestigd</th>
              <th scope="col" className="p-3">Laatste login</th>
            </tr>
          </thead>
          <tbody>
            {users.items.map((user) => (
              <tr key={user.id} className="border-b border-[var(--color-line)]">
                <td className="p-3 font-semibold">{user.displayName}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">
                  <Badge tone={user.role === "PARENT" ? "neutral" : "brand"}>{user.role}</Badge>
                </td>
                <td className="p-3">{user.emailVerifiedAt ? t("common.yes") : t("common.no")}</td>
                <td className="p-3">
                  {user.lastLoginAt ? (
                    <time dateTime={user.lastLoginAt.toISOString()}>{user.lastLoginAt.toISOString().slice(0, 10)}</time>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
