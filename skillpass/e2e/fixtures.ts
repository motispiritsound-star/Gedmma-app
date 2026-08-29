import { expect, type Page } from '@playwright/test';

export const DEMO_PASSWORD = 'SkillPass!2026';

export const ACCOUNTS = {
  guardian: 'guardian@skillpass.local',
  provider: 'provider@skillpass.local',
  providerOwner: 'owner.sportclub-de-vechtstroom@skillpass.local',
  otherProviderOwner: 'owner.makerslab-utrecht@skillpass.local',
  pendingProviderOwner: 'owner.levensles-utrecht@skillpass.local',
  admin: 'admin@skillpass.local',
} as const;

export async function login(page: Page, email: string, password = DEMO_PASSWORD, locale = 'nl') {
  await page.goto(`/${locale}/auth/login`);
  await page.getByLabel(locale === 'nl' ? 'E-mailadres' : 'Email address').fill(email);
  await page.getByLabel(locale === 'nl' ? 'Wachtwoord' : 'Password').fill(password);
  await page.getByRole('button', { name: locale === 'nl' ? 'Inloggen' : 'Log in' }).click();
  await page.waitForURL(`**/${locale}/search`);
}

export async function logout(page: Page, locale = 'nl') {
  await page.getByRole('button', { name: locale === 'nl' ? 'Uitloggen' : 'Log out' }).click();
  await expect(page.getByRole('link', { name: locale === 'nl' ? 'Inloggen' : 'Log in' })).toBeVisible();
}
