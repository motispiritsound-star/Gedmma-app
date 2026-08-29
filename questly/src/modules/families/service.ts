import "server-only";
import type { Family, FamilyPreference } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit";
import type { FamilyPreferenceInput, FamilySettingsInput } from "./schemas";

export type FamilyWithPreference = Family & { preference: FamilyPreference | null };

export async function getFamily(familyId: string): Promise<FamilyWithPreference> {
  const family = await prisma.family.findFirst({
    where: { id: familyId, deletedAt: null },
    include: { preference: true },
  });
  if (!family) throw new NotFoundError("Family not found.");
  return family;
}

export async function getPreference(familyId: string): Promise<FamilyPreference> {
  const existing = await prisma.familyPreference.findUnique({ where: { familyId } });
  return existing ?? prisma.familyPreference.create({ data: { familyId } });
}

export async function updateFamilySettings(params: {
  familyId: string;
  actorUserId: string;
  input: FamilySettingsInput;
}): Promise<Family> {
  const family = await prisma.family.update({
    where: { id: params.familyId },
    data: {
      name: params.input.name,
      locale: params.input.locale === "en" ? "EN" : "NL",
      environment: params.input.environment,
      requireParentApproval: params.input.requireParentApproval,
    },
  });

  await recordAudit({
    action: AUDIT_ACTIONS.familyUpdated,
    targetType: "family",
    targetId: family.id,
    actorUserId: params.actorUserId,
    familyId: family.id,
  });

  return family;
}

export async function updatePreference(params: {
  familyId: string;
  input: FamilyPreferenceInput;
}): Promise<FamilyPreference> {
  return prisma.familyPreference.upsert({
    where: { familyId: params.familyId },
    create: { familyId: params.familyId, ...params.input },
    update: params.input,
  });
}

export async function completeOnboarding(familyId: string): Promise<void> {
  await prisma.family.update({
    where: { id: familyId },
    data: { onboardingCompletedAt: new Date() },
  });
}
