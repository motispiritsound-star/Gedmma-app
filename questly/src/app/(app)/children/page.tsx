import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { listChildren } from "@/modules/children";
import { listInterests } from "@/modules/quests/service";
import { getEntitlements } from "@/modules/subscriptions";
import { deleteChildAction } from "@/server-actions/family";
import { ChildProfileForm } from "@/components/forms/child-profile-form";
import { Avatar } from "@/components/ui/illustration";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Kindprofielen" };
export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const user = await requireFamily();
  const { locale, t } = await getTranslator();

  const [children, interests, entitlements] = await Promise.all([
    listChildren(user.familyId),
    listInterests(locale),
    getEntitlements(user.familyId),
  ]);

  const atLimit = children.length >= entitlements.maxChildProfiles;

  return (
    <div className="q-container max-w-4xl py-8">
      <SectionHeading
        level={1}
        title={t("children.title")}
        description={t("children.limitReached", { max: entitlements.maxChildProfiles })}
      />

      {children.length === 0 ? <EmptyState title={t("children.empty")} /> : null}

      <ul className="space-y-4">
        {children.map((child) => (
          <Card as="li" key={child.id} className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Avatar avatarKey={child.avatarKey} nickname={child.nickname} size={48} />
              <div className="flex-1">
                <h2 className="text-xl">{child.nickname}</h2>
                <p className="text-sm text-[var(--color-ink-soft)]">{t(`ageBand.${child.ageBand}`)}</p>
              </div>
              <ul className="flex flex-wrap gap-1">
                {child.interests.map((link) => (
                  <li key={link.interest.id}>
                    <Badge tone="brand">
                      <span aria-hidden="true">{link.interest.emoji}</span>
                      {locale === "en" ? link.interest.nameEn : link.interest.nameNl}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>

            <details>
              <summary className="q-btn q-btn--secondary w-fit cursor-pointer list-none">{t("children.edit")}</summary>
              <div className="mt-4">
                <ChildProfileForm
                  locale={locale}
                  mode="edit"
                  interests={interests}
                  defaults={{
                    id: child.id,
                    nickname: child.nickname,
                    ageBand: child.ageBand,
                    avatarKey: child.avatarKey,
                    interestSlugs: child.interests.map((link) => link.interest.slug),
                  }}
                />
                <form action={deleteChildAction} className="mt-4 border-t border-[var(--color-line)] pt-4">
                  <input type="hidden" name="childId" value={child.id} />
                  <button type="submit" className="q-btn q-btn--danger">
                    {t("children.delete")}
                  </button>
                </form>
              </div>
            </details>
          </Card>
        ))}
      </ul>

      <Card className="mt-6 p-5">
        <h2 className="mb-4 text-xl">{t("children.add")}</h2>
        {atLimit ? (
          <p className="q-badge q-badge--accent px-3 py-2">
            {t("children.limitReached", { max: entitlements.maxChildProfiles })}
          </p>
        ) : (
          <ChildProfileForm locale={locale} mode="create" interests={interests} />
        )}
      </Card>
    </div>
  );
}
