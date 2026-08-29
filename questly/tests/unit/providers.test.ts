import { describe, expect, it } from 'vitest'
import { MockPaymentProvider, getPaymentProvider } from '@/modules/subscriptions/provider'
import { getAiProvider, NullAiProvider } from '@/modules/recommendations/ai'
import { getEmailProvider } from '@/modules/email'
import { getMediaStorage, LocalDiskStorage } from '@/modules/media/storage'
import { isoWeekKey, rotatingFreeSelection, entitlementsFor } from '@/modules/subscriptions/plans'

/**
 * Acceptance criterion 11: the application must run with no Stripe key and no
 * AI credentials. These tests assert the defaults, not a mocked configuration.
 */

describe('external service defaults', () => {
  it('uses the mock payment provider when no Stripe key is configured', () => {
    const provider = getPaymentProvider()
    expect(provider.isMock).toBe(true)
    expect(provider.name).toBe('mock')
  })

  it('produces a usable checkout URL without Stripe', async () => {
    const provider = new MockPaymentProvider()
    const session = await provider.createCheckoutSession({
      familyId: 'family-1',
      email: 'parent@example.test',
      plan: 'FAMILY_PREMIUM',
      successUrl: 'http://localhost:3000/settings/subscription/confirm',
      cancelUrl: 'http://localhost:3000/settings/subscription',
    })
    expect(session.url).toContain('/settings/subscription/confirm')
    expect(session.id.startsWith('mock_cs_')).toBe(true)
  })

  it('falls back to a no-op AI provider that passes rankings through', async () => {
    const provider = getAiProvider()
    expect(provider.available).toBe(false)
    const nullProvider = new NullAiProvider()
    const input = [{ quest: { id: 'a' }, score: 1, reasons: [], excluded: false }]
    // @ts-expect-error - a minimal shape is enough to prove it is a pass-through
    expect(await nullProvider.rerank(input)).toBe(input)
  })

  it('uses a local media adapter in development and test', () => {
    expect(getMediaStorage()).toBeInstanceOf(LocalDiskStorage)
  })

  it('uses a non-delivering e-mail driver in tests', () => {
    expect(getEmailProvider().name).toBe('noop')
  })
})

describe('plan entitlements', () => {
  it('limits the free plan to one child profile', () => {
    expect(entitlementsFor('FREE').maxChildProfiles).toBe(1)
    expect(entitlementsFor(null).maxChildProfiles).toBe(1)
  })

  it('gives premium families five profiles and the whole library', () => {
    const premium = entitlementsFor('FAMILY_PREMIUM')
    expect(premium.maxChildProfiles).toBe(5)
    expect(premium.questAccess).toBe('full-library')
    expect(premium.weeklyPlanner).toBe(true)
  })
})

describe('free quest rotation', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

  it('is stable within a week and changes between weeks', () => {
    const week1 = rotatingFreeSelection(ids, 4, 202601)
    const week2 = rotatingFreeSelection(ids, 4, 202602)
    expect(rotatingFreeSelection(ids, 4, 202601)).toEqual(week1)
    expect(week2).not.toEqual(week1)
  })

  it('returns everything when the library is smaller than the rotation', () => {
    expect(rotatingFreeSelection(['a', 'b'], 8)).toEqual(['a', 'b'])
  })

  it('returns exactly the requested number of quests', () => {
    expect(rotatingFreeSelection(ids, 4, isoWeekKey(new Date('2026-06-01')))).toHaveLength(4)
  })
})
