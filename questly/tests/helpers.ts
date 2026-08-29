import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { registerParent } from "@/modules/auth/service";
import { createChild } from "@/modules/children";
import { activatePremium } from "@/modules/subscriptions";

export type TestFamily = { userId: string; familyId: string; email: string };

/** Registers an isolated parent + family for one test. */
export async function makeFamily(overrides: { premium?: boolean } = {}): Promise<TestFamily> {
  const email = `test-${randomUUID()}@questly.test`;
  const result = await registerParent(
    {
      displayName: "Test Parent",
      email,
      password: "SuperSecretPassphrase1",
      familyName: `Family ${email.slice(5, 13)}`,
      locale: "nl",
      consent: true,
    },
    null,
  );

  await prisma.user.update({ where: { id: result.userId }, data: { emailVerifiedAt: new Date() } });
  if (overrides.premium !== false) {
    await activatePremium({ familyId: result.familyId, actorUserId: result.userId });
  }

  return { userId: result.userId, familyId: result.familyId, email };
}

export async function addChild(
  family: TestFamily,
  input: { nickname?: string; ageBand?: "AGE_6_8" | "AGE_9_11" | "AGE_12_15"; interestSlugs?: string[] } = {},
) {
  return createChild({
    familyId: family.familyId,
    actorUserId: family.userId,
    input: {
      nickname: input.nickname ?? `Kid${Math.floor(Math.random() * 100000)}`,
      ageBand: input.ageBand ?? "AGE_9_11",
      avatarKey: "fox",
      interestSlugs: input.interestSlugs ?? [],
    },
  });
}

/** A minimal but genuinely valid PNG, used to exercise upload validation. */
export function pngFixture(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
}

export async function cleanupFamily(family: TestFamily): Promise<void> {
  await prisma.family.deleteMany({ where: { id: family.familyId } });
  await prisma.user.deleteMany({ where: { id: family.userId } });
}
