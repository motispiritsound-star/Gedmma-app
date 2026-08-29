import { describe, expect, it } from "vitest";
import { generateToken, hashIp, hashPassword, hashToken, sign, verifyPassword, verifySignature } from "@/lib/crypto";
import { signMediaUrl, verifyMediaToken } from "@/modules/media/signed-url";
import { sniffImageType, validateUpload } from "@/modules/media/validation";
import { entitlementsFor, isoWeekKey, rotatingSelection } from "@/modules/subscriptions/entitlements";
import { pngFixture } from "../helpers";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("correct horse battery stapl", hash)).toBe(false);
  });

  it("never stores the password itself", async () => {
    const hash = await hashPassword("a-very-secret-password");
    expect(hash).not.toContain("a-very-secret-password");
    expect(hash.startsWith("scrypt$")).toBe(true);
  });

  it("produces a different hash for the same password", async () => {
    expect(await hashPassword("same-password-twice")).not.toBe(await hashPassword("same-password-twice"));
  });

  it("rejects a malformed stored hash instead of throwing", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});

describe("tokens", () => {
  it("stores only a hash of a session token", () => {
    const token = generateToken();
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("pseudonymises IP addresses", () => {
    expect(hashIp("192.0.2.7", "secret")).not.toContain("192.0.2.7");
    expect(hashIp(null, "secret")).toBeNull();
  });

  it("verifies HMAC signatures and rejects tampering", () => {
    const signature = sign("payload", "secret");
    expect(verifySignature("payload", signature, "secret")).toBe(true);
    expect(verifySignature("payload!", signature, "secret")).toBe(false);
    expect(verifySignature("payload", signature, "other-secret")).toBe(false);
  });
});

describe("signed media URLs", () => {
  const secret = "media-secret-for-tests-0123456789";

  it("accepts a fresh token for the right family", () => {
    const expiresAt = Date.now() + 60_000;
    const url = signMediaUrl({ evidenceId: "ev1", familyId: "fam1", expiresAt }, secret);
    const params = new URL(url, "http://localhost").searchParams;
    expect(
      verifyMediaToken({ evidenceId: "ev1", familyId: "fam1", exp: params.get("exp"), sig: params.get("sig") }, secret),
    ).toBe(true);
  });

  it("rejects the same token for a different family", () => {
    const expiresAt = Date.now() + 60_000;
    const url = signMediaUrl({ evidenceId: "ev1", familyId: "fam1", expiresAt }, secret);
    const params = new URL(url, "http://localhost").searchParams;
    expect(
      verifyMediaToken({ evidenceId: "ev1", familyId: "fam2", exp: params.get("exp"), sig: params.get("sig") }, secret),
    ).toBe(false);
  });

  it("rejects an expired token", () => {
    const expiresAt = Date.now() - 1;
    const url = signMediaUrl({ evidenceId: "ev1", familyId: "fam1", expiresAt }, secret);
    const params = new URL(url, "http://localhost").searchParams;
    expect(
      verifyMediaToken({ evidenceId: "ev1", familyId: "fam1", exp: params.get("exp"), sig: params.get("sig") }, secret),
    ).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyMediaToken({ evidenceId: "ev1", familyId: "fam1", exp: null, sig: null }, secret)).toBe(false);
  });
});

describe("upload validation", () => {
  it("accepts a real PNG", () => {
    expect(validateUpload(pngFixture(), 1_000_000)).toBe("image/png");
  });

  it("rejects a file whose bytes are not an image", () => {
    const html = Buffer.from("<html><script>alert(1)</script></html>");
    expect(sniffImageType(html)).toBeNull();
    expect(() => validateUpload(html, 1_000_000)).toThrowError(/JPEG, PNG and WebP/);
  });

  it("rejects an oversized file", () => {
    expect(() => validateUpload(pngFixture(), 10)).toThrowError(/at most/);
  });

  it("rejects an empty file", () => {
    expect(() => validateUpload(Buffer.alloc(0), 1000)).toThrowError(/empty/);
  });
});

describe("entitlements", () => {
  it("limits the free plan to one child profile and no planner", () => {
    const free = entitlementsFor("FREE");
    expect(free.maxChildProfiles).toBe(1);
    expect(free.weeklyPlanner).toBe(false);
    expect(free.libraryAccess).toBe("ROTATING");
  });

  it("gives Family Premium the full library and five profiles", () => {
    const premium = entitlementsFor("FAMILY_PREMIUM");
    expect(premium.maxChildProfiles).toBe(5);
    expect(premium.weeklyPlanner).toBe(true);
    expect(premium.libraryAccess).toBe("FULL");
  });

  it("rotates the free selection deterministically per week", () => {
    const slugs = Array.from({ length: 30 }, (_, index) => `quest-${index}`);
    const weekOne = rotatingSelection(slugs, "2026-W10", 12);
    const weekOneAgain = rotatingSelection(slugs, "2026-W10", 12);
    const weekTwo = rotatingSelection(slugs, "2026-W11", 12);

    expect(weekOne).toHaveLength(12);
    expect(weekOne).toEqual(weekOneAgain);
    expect(weekOne).not.toEqual(weekTwo);
  });

  it("computes ISO week keys", () => {
    expect(isoWeekKey(new Date("2026-01-05T00:00:00Z"))).toBe("2026-W02");
  });
});
