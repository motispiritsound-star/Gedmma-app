import { expect, test } from "@playwright/test";
import { DEMO, signIn } from "./fixtures";

test.describe("access control", () => {
  test("a signed-out visitor cannot reach the app or the admin area", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/signin/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/signin/);
  });

  test("an administrator without a family lands in the admin area, not in a redirect loop", async ({ page }) => {
    await signIn(page, DEMO.admin);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/admin/);
    await page.goto("/signin");
    await expect(page).toHaveURL(/\/admin/);
  });

  test("a parent cannot reach the admin area", async ({ page }) => {
    await signIn(page, DEMO.parent);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/home/);

    await page.goto("/admin/quests");
    await expect(page).toHaveURL(/\/home/);

    await page.goto("/admin/audit");
    await expect(page).toHaveURL(/\/home/);
  });

  test("a forged media link is refused, signed in or not", async ({ page, request }) => {
    // No session at all.
    const anonymous = await request.get("/api/media/some-evidence-id?exp=99999999999999&sig=forged");
    expect(anonymous.status()).toBe(401);

    // Signed in as a parent, but the signature does not match this family.
    // The fetch is issued from the page so it carries the session cookie.
    await signIn(page, DEMO.parent);
    const signedIn = await page.evaluate(
      async () => (await fetch("/api/media/some-evidence-id?exp=99999999999999&sig=forged")).status,
    );
    expect(signedIn).toBe(403);

    // A well-formed request without a signature is refused too.
    const unsigned = await page.evaluate(async () => (await fetch("/api/media/some-evidence-id")).status);
    expect(unsigned).toBe(403);
  });
});

test.describe("content administration", () => {
  test("an admin can create, preview and publish a quest", async ({ page, browser }) => {
    await signIn(page, DEMO.admin);

    await page.goto("/admin/quests/new");
    await expect(page.getByRole("heading", { level: 1, name: "Nieuwe quest" })).toBeVisible();

    const slug = `e2e-quest-${Date.now()}`;
    await page.locator("#slug").fill(slug);
    await page.locator("#categorySlug").selectOption("science");
    await page.locator("#durationMinutes").fill("45");
    await page.getByRole("checkbox", { name: "9 tot 11 jaar" }).check();
    await page.getByRole("checkbox", { name: "Nieuwsgierigheid" }).check();

    await page.locator("#nlTitle").fill("Testavontuur");
    await page.locator("#nlSummary").fill("Een korte samenvatting voor de test.");
    await page.locator("#nlStory").fill("Een verhaal dat lang genoeg is om te valideren.");
    await page.locator("#nlObjective").fill("Het kind leert testen.");
    await page.locator("#nlResult").fill("Een geslaagde test.");

    await page.locator("#enTitle").fill("Test adventure");
    await page.locator("#enSummary").fill("A short summary for the test.");
    await page.locator("#enStory").fill("A story that is long enough to validate.");
    await page.locator("#enObjective").fill("The child learns to test.");
    await page.locator("#enResult").fill("A passing test.");

    await page.locator("#stepNlTitle-0").fill("Stap een");
    await page.locator("#stepEnTitle-0").fill("Step one");
    await page.locator("#stepNlBody-0").fill("Doe het eerste ding.");
    await page.locator("#stepEnBody-0").fill("Do the first thing.");

    await page.locator("#reflectionTextNl-0").fill("Wat ging goed?");
    await page.locator("#reflectionTextEn-0").fill("What went well?");

    await page.getByRole("button", { name: "Opslaan" }).click();

    await expect(page).toHaveURL(new RegExp(`/admin/quests/${slug}`));
    await expect(page.getByText("Concept").first()).toBeVisible();

    await page.getByRole("link", { name: "Voorbeeld" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Testavontuur" })).toBeVisible();

    await page.goto(`/admin/quests/${slug}`);
    await page.getByRole("button", { name: "Publiceren" }).click();
    await expect(page.getByText("Gepubliceerd").first()).toBeVisible();

    // A family can now find it. A separate browser context keeps the two
    // sessions apart instead of signing one account out of the other.
    const familyContext = await browser.newContext();
    const familyPage = await familyContext.newPage();
    await signIn(familyPage, DEMO.parent);
    await familyPage.goto(`/quests/${slug}`);
    await expect(familyPage.getByRole("heading", { level: 1, name: "Testavontuur" })).toBeVisible();
    await familyContext.close();
  });

  test("the audit log records administrative actions", async ({ page }) => {
    await signIn(page, DEMO.admin);
    await page.goto("/admin/audit");

    await expect(page.getByRole("heading", { level: 1, name: "Auditlog" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "quest.created" }).first()).toBeVisible();
  });

  test("the family overview shows counts but not private content", async ({ page }) => {
    await signIn(page, DEMO.admin);
    await page.goto("/admin/families");

    await expect(page.getByRole("heading", { level: 1, name: "Gezinnen" })).toBeVisible();
    await expect(page.getByText("Familie de Vries")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Het hotel hangt aan de schuur.");
  });
});
