import { expect, type Page } from "@playwright/test";

export const DEMO = {
  parent: { email: "ouder@questly.test", password: "QuestlyDemo!2026" },
  admin: { email: "admin@questly.test", password: "QuestlyAdmin!2026" },
} as const;

export async function signIn(page: Page, account: { email: string; password: string }): Promise<void> {
  await page.goto("/signin");
  await page.getByLabel("E-mailadres").fill(account.email);
  await page.getByLabel("Wachtwoord").fill(account.password);
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL(/\/(home|admin|verify|onboarding)/);
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@questly.test`;
}

export async function registerParent(
  page: Page,
  options: { email: string; familyName: string },
): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Jouw naam").fill("E2E Ouder");
  await page.getByLabel("Naam van je gezin").fill(options.familyName);
  await page.getByLabel("E-mailadres").fill(options.email);
  await page.getByLabel("Wachtwoord").fill("EenHeelSterkWachtwoord1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Account maken" }).click();

  await page.waitForURL(/\/verify/);
  await page.getByRole("button", { name: "Bevestig je e-mailadres" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
}
