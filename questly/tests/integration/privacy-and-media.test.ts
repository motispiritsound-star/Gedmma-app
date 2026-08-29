import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { deleteEvidence, grantUrls, readEvidenceFor, storeEvidence } from "@/modules/media";
import { verifyMediaToken } from "@/modules/media/signed-url";
import { env } from "@/lib/env";
import { startQuest } from "@/modules/progress";
import { deleteChild } from "@/modules/children";
import { cancelAccountDeletion, exportFamilyData, pendingDeletion, requestAccountDeletion } from "@/modules/privacy";
import { AUDIT_ACTIONS } from "@/modules/audit";
import { addChild, cleanupFamily, makeFamily, pngFixture, type TestFamily } from "../helpers";

const created: TestFamily[] = [];

async function newFamily(): Promise<TestFamily> {
  const family = await makeFamily();
  created.push(family);
  return family;
}

afterAll(async () => {
  for (const family of created) await cleanupFamily(family);
});

describe("private evidence", () => {
  it("cannot be read by another family", async () => {
    const owner = await newFamily();
    const stranger = await newFamily();
    const child = await addChild(owner, { nickname: "Fotograaf" });

    const completion = await startQuest({
      familyId: owner.familyId,
      userId: owner.userId,
      questSlug: "leaf-detective",
    });
    const evidence = await storeEvidence({
      familyId: owner.familyId,
      completionId: completion.id,
      userId: owner.userId,
      bytes: pngFixture(),
    });
    expect(child).toBeTruthy();

    const own = await readEvidenceFor({
      evidenceId: evidence.id,
      familyId: owner.familyId,
      userId: owner.userId,
    });
    expect(own.mimeType).toBe("image/png");

    await expect(
      readEvidenceFor({ evidenceId: evidence.id, familyId: stranger.familyId, userId: stranger.userId }),
    ).rejects.toThrowError(ForbiddenError);

    const denied = await prisma.auditLog.findFirst({
      where: { action: AUDIT_ACTIONS.evidenceViewed, targetId: evidence.id },
      orderBy: { createdAt: "desc" },
    });
    expect(denied?.metadata).toMatchObject({ outcome: "denied_cross_family" });
  });

  it("is private by default", async () => {
    const owner = await newFamily();
    const completion = await startQuest({
      familyId: owner.familyId,
      userId: owner.userId,
      questSlug: "leaf-detective",
    });
    const evidence = await storeEvidence({
      familyId: owner.familyId,
      completionId: completion.id,
      userId: owner.userId,
      bytes: pngFixture(),
    });
    expect(evidence.visibility).toBe("PRIVATE");
  });

  it("is only reachable through a family-scoped, expiring link", async () => {
    const owner = await newFamily();
    const stranger = await newFamily();
    const completion = await startQuest({
      familyId: owner.familyId,
      userId: owner.userId,
      questSlug: "leaf-detective",
    });
    const evidence = await storeEvidence({
      familyId: owner.familyId,
      completionId: completion.id,
      userId: owner.userId,
      bytes: pngFixture(),
    });

    const [granted] = grantUrls(
      [{ id: evidence.id, mimeType: evidence.mimeType, createdAt: evidence.createdAt }],
      owner.familyId,
    );
    const params = new URL(granted!.url, "http://localhost").searchParams;

    expect(
      verifyMediaToken(
        { evidenceId: evidence.id, familyId: owner.familyId, exp: params.get("exp"), sig: params.get("sig") },
        env().MEDIA_SECRET,
      ),
    ).toBe(true);

    expect(
      verifyMediaToken(
        { evidenceId: evidence.id, familyId: stranger.familyId, exp: params.get("exp"), sig: params.get("sig") },
        env().MEDIA_SECRET,
      ),
    ).toBe(false);
  });

  it("rejects a file that is not a real image", async () => {
    const owner = await newFamily();
    const completion = await startQuest({
      familyId: owner.familyId,
      userId: owner.userId,
      questSlug: "leaf-detective",
    });

    await expect(
      storeEvidence({
        familyId: owner.familyId,
        completionId: completion.id,
        userId: owner.userId,
        bytes: Buffer.from("<svg onload=alert(1)>"),
      }),
    ).rejects.toThrowError(/JPEG, PNG and WebP/);
  });

  it("refuses to attach evidence to another family's adventure", async () => {
    const owner = await newFamily();
    const stranger = await newFamily();
    const completion = await startQuest({
      familyId: owner.familyId,
      userId: owner.userId,
      questSlug: "leaf-detective",
    });

    await expect(
      storeEvidence({
        familyId: stranger.familyId,
        completionId: completion.id,
        userId: stranger.userId,
        bytes: pngFixture(),
      }),
    ).rejects.toThrowError(NotFoundError);
  });

  it("removes the stored object when evidence is deleted", async () => {
    const owner = await newFamily();
    const completion = await startQuest({
      familyId: owner.familyId,
      userId: owner.userId,
      questSlug: "leaf-detective",
    });
    const evidence = await storeEvidence({
      familyId: owner.familyId,
      completionId: completion.id,
      userId: owner.userId,
      bytes: pngFixture(),
    });

    await deleteEvidence({ evidenceId: evidence.id, familyId: owner.familyId, userId: owner.userId });
    await expect(
      readEvidenceFor({ evidenceId: evidence.id, familyId: owner.familyId, userId: owner.userId }),
    ).rejects.toThrowError(NotFoundError);
  });
});

describe("data export", () => {
  it("returns the family's own data and records the export", async () => {
    const family = await newFamily();
    await addChild(family, { nickname: "Exporteerbaar", interestSlugs: ["animals"] });

    const data = await exportFamilyData({ familyId: family.familyId, userId: family.userId });

    expect(data.family.id).toBe(family.familyId);
    expect(data.children.map((child) => child.nickname)).toContain("Exporteerbaar");
    expect(data.format).toBe("questly-family-export/1");

    const audit = await prisma.auditLog.findFirst({
      where: { action: AUDIT_ACTIONS.dataExported, familyId: family.familyId },
    });
    expect(audit).not.toBeNull();
  });
});

describe("deletion flow", () => {
  it("schedules deletion, can be cancelled, and is idempotent", async () => {
    const family = await newFamily();

    const request = await requestAccountDeletion({ userId: family.userId, familyId: family.familyId });
    expect(request.scheduledPurgeAt.getTime()).toBeGreaterThan(Date.now());

    const again = await requestAccountDeletion({ userId: family.userId, familyId: family.familyId });
    expect(again.id).toBe(request.id);

    expect(await pendingDeletion(family.userId)).not.toBeNull();
    await cancelAccountDeletion(family.userId);
    expect(await pendingDeletion(family.userId)).toBeNull();
  });
});

describe("child profile deletion", () => {
  it("keeps the family's own history but removes identifying text", async () => {
    const family = await newFamily();
    const child = await addChild(family, { nickname: "Weggaand", interestSlugs: ["animals"] });

    await deleteChild({ familyId: family.familyId, childId: child.id, actorUserId: family.userId });

    const stored = await prisma.childProfile.findUniqueOrThrow({
      where: { id: child.id },
      include: { interests: true },
    });
    expect(stored.deletedAt).not.toBeNull();
    expect(stored.nickname).not.toBe("Weggaand");
    expect(stored.interests).toHaveLength(0);
  });
});
