import type { Page } from '@playwright/test';

export const DEMO_PASSWORD = 'wonderbox-demo';

export const ACCOUNTS = {
  parent: 'ouder@wonderbox.test',
  editor: 'editor@wonderbox.test',
  approver: 'approver@wonderbox.test',
  ops: 'ops@wonderbox.test',
  support: 'support@wonderbox.test',
  admin: 'admin@wonderbox.test',
} as const;

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mailadres').fill(email);
  await page.getByLabel('Wachtwoord').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Inloggen' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Uitloggen' }).click();
  await page.waitForURL('**/');
}
