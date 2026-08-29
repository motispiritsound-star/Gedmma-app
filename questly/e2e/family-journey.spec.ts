import { expect, test } from "@playwright/test";
import { DEMO, registerParent, signIn, uniqueEmail } from "./fixtures";

test.describe("parent onboarding", () => {
  test("a parent can register, create a family and add a child profile", async ({ page }) => {
    const email = uniqueEmail("journey");
    await registerParent(page, { email, familyName: "Familie E2E" });

    // Step 1 - family
    await expect(page.getByRole("heading", { level: 1, name: "Laten we je gezin instellen" })).toBeVisible();
    await page.getByRole("radio", { name: "Stad" }).check();
    await page.getByRole("button", { name: "Volgende" }).click();

    // Step 2 - child profile
    await expect(page).toHaveURL(/step=child/);
    await page.getByLabel("Bijnaam").fill("Pippa");
    await page.getByRole("radio", { name: "6 tot 8 jaar" }).check();
    await page.getByRole("checkbox", { name: /Dieren/ }).check();
    await page.getByRole("button", { name: "Kindprofiel toevoegen" }).click();

    // Step 3 - preferences
    await expect(page).toHaveURL(/step=preferences/);
    await page.getByRole("radio", { name: "Makkelijk" }).check();
    await page.getByRole("button", { name: "Klaar, laat quests zien" }).click();

    await expect(page).toHaveURL(/\/home/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hallo");

    // The child profile is stored and visible.
    await page.getByRole("link", { name: "Kindprofielen" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Pippa" })).toBeVisible();
    await expect(page.getByText("6 tot 8 jaar").first()).toBeVisible();
  });

  test("recommendations respect the child's age band", async ({ page }) => {
    const email = uniqueEmail("agecheck");
    await registerParent(page, { email, familyName: "Familie Leeftijd" });

    await page.getByRole("button", { name: "Volgende" }).click();
    await page.getByLabel("Bijnaam").fill("Kleine");
    await page.getByRole("radio", { name: "6 tot 8 jaar" }).check();
    await page.getByRole("button", { name: "Kindprofiel toevoegen" }).click();
    await page.getByRole("button", { name: "Klaar, laat quests zien" }).click();

    await expect(page).toHaveURL(/\/home/);
    const cards = page.locator("section[aria-labelledby='recommended-heading'] article");
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(cards.nth(index)).toContainText("6 tot 8 jaar");
    }
  });
});

test.describe("adventure and completion", () => {
  test("a family starts a quest, completes it and a parent approves it", async ({ page }) => {
    await signIn(page, DEMO.parent);

    await page.goto("/quests/insect-hotel");
    await expect(page.getByRole("heading", { level: 1, name: "Bouw een insectenhotel" })).toBeVisible();
    await page.getByRole("button", { name: "Start avontuur" }).click();

    await expect(page).toHaveURL(/\/adventure\//);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Bouw een insectenhotel");

    // Skip the countdown, then the "put the screen away" screen.
    await page.getByRole("button", { name: "Volgende" }).click();
    await expect(page.getByText("Leg het scherm nu weg en ga het avontuur in.")).toBeVisible();
    await page.getByRole("button", { name: "Volgende stap" }).click();

    await expect(page.getByText(/Stap 1 van/)).toBeVisible();
    await page.getByRole("button", { name: "Volgende stap →" }).click();
    await expect(page.getByText(/Stap 2 van/)).toBeVisible();

    await page.getByRole("link", { name: "We zijn klaar" }).click();
    await expect(page).toHaveURL(/\/complete\//);

    await page.getByRole("checkbox", { name: "Noor" }).check();
    await page.getByLabel("Hoelang waren jullie bezig?").fill("75");
    await page.getByLabel("Prive notitie voor het gezin").fill("Het hotel hangt aan de schuur.");
    await page.getByRole("button", { name: "Ter goedkeuring versturen" }).click();

    await expect(page.getByText("Wacht op goedkeuring van een ouder.")).toBeVisible();
    await page.getByRole("button", { name: "Goedkeuren", exact: true }).click();

    await expect(page.getByText("Goedgekeurd").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mooi gedaan." })).toBeVisible();

    await page.getByRole("link", { name: "Gezinsoverzicht" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Gezinsoverzicht" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bouw een insectenhotel" }).first()).toBeVisible();
  });
});

test.describe("quest library", () => {
  test("filters narrow the results and stay in the URL", async ({ page }) => {
    await signIn(page, DEMO.parent);
    await page.goto("/quests");

    await expect(page.getByRole("heading", { level: 1, name: "Questbibliotheek" })).toBeVisible();
    await page.getByLabel("Categorie").selectOption("cooking");
    await page.getByRole("button", { name: "Filters toepassen" }).click();

    await expect(page).toHaveURL(/categorySlug=cooking/);
    const cards = page.locator("ul.grid > li article");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(cards.nth(index)).toContainText("Koken");
    }
  });

  test("a quest can be saved to favourites", async ({ page }) => {
    await signIn(page, DEMO.parent);
    await page.goto("/quests/sound-map-walk");

    const save = page.getByRole("button", { name: /Bewaren|Uit favorieten/ });
    const before = (await save.textContent()) ?? "";
    await save.click();
    await expect(page.getByRole("button", { name: /Bewaren|Uit favorieten/ })).not.toHaveText(before);
  });
});
