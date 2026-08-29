import { expect, test } from "@playwright/test";
import { DEMO, signIn } from "./fixtures";

test.describe("Dutch and English", () => {
  test("the landing page switches language and marks it in the document", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "nl");
    const nav = page.getByRole("navigation", { name: "Hoofdnavigatie" });
    await expect(nav.getByRole("link", { name: "Hoe het werkt" })).toBeVisible();

    await page.getByRole("button", { name: /Switch to English/ }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "How it works" }),
    ).toBeVisible();
    await expect(page.getByText("Open the app, choose an adventure").first()).toBeVisible();
  });

  test("quest content renders in both languages", async ({ page }) => {
    await signIn(page, DEMO.parent);

    await page.goto("/quests/leaf-detective");
    await expect(page.getByRole("heading", { level: 1, name: "Bladerdetective" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Ga op pad" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Veiligheid" })).toBeVisible();

    await page.getByRole("button", { name: /Switch to English/ }).click();
    await page.goto("/quests/leaf-detective");

    await expect(page.getByRole("heading", { level: 1, name: "Leaf detective" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Head out" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Safety" })).toBeVisible();
    await expect(page.getByText("Never eat leaves, berries or mushrooms you find outdoors.")).toBeVisible();
  });

  test("the language choice survives navigation", async ({ page }) => {
    await page.goto("/pricing");
    await page.getByRole("button", { name: /Switch to English/ }).click();
    await page.goto("/how-it-works");
    await expect(page.getByRole("heading", { level: 1, name: "How it works" })).toBeVisible();
  });
});
