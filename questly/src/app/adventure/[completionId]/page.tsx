import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "@/modules/i18n/server";
import { getSessionUser } from "@/modules/auth/session";
import { getEntitlements } from "@/modules/subscriptions";
import { getQuestById } from "@/modules/quests";
import { getCompletion } from "@/modules/progress";
import { NotFoundError } from "@/lib/errors";
import { AdventureClient } from "./adventure-client";

export const metadata: Metadata = { title: "Avontuurmodus", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdventurePage({ params }: { params: Promise<{ completionId: string }> }) {
  const { completionId } = await params;
  const user = await getSessionUser();
  if (!user?.familyId) redirect("/signin");

  const locale = await getLocale();

  let completion;
  try {
    completion = await getCompletion(user.familyId, completionId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const entitlements = await getEntitlements(user.familyId);
  const quest = await getQuestById({ id: completion.questId, locale, entitlements });

  return (
    <AdventureClient
      quest={quest}
      completionId={completion.id}
      locale={locale}
      startedAtIso={completion.startedAt.toISOString()}
    />
  );
}
