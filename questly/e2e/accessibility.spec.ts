import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { DEMO, signIn } from "./fixtures";

/** WCAG 2.2 AA rule set, minus rules that only apply to full-page audits. */
async function audit(page: Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
}

test.describe("public pages meet basic accessibility checks", () => {
  for (const path of ["/", "/how-it-works", "/pricing", "/privacy", "/signin", "/register"]) {
    test(`no detectable violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await audit(page);
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
});

test.describe("authenticated pages meet basic accessibility checks", () => {
  for (const path of ["/home", "/quests", "/quests/leaf-detective", "/dashboard", "/planner", "/children", "/settings"]) {
    test(`no detectable violations on ${path}`, async ({ page }) => {
      await signIn(page, DEMO.parent);
      await page.goto(path);
      const results = await audit(page);
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
});

test.describe("keyboard and focus", () => {
  test("the skip link is the first focusable element and reaches the main region", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Ga direct naar de inhoud" });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeVisible();
  });

  test("the sign-in form can be completed with the keyboard alone", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel("E-mailadres").focus();
    await page.keyboard.type(DEMO.parent.email);
    await page.keyboard.press("Tab");
    await page.keyboard.type(DEMO.parent.password);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/home/);
  });

  test("every page has exactly one first-level heading", async ({ page }) => {
    await signIn(page, DEMO.parent);
    for (const path of ["/home", "/quests", "/dashboard", "/planner", "/children", "/settings"]) {
      await page.goto(path);
      await expect(page.locator("h1"), `h1 count on ${path}`).toHaveCount(1);
    }
  });
});
