'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireFamily } from '@/modules/auth/guards'
import { cancelPlan, resumePlan, startCheckout } from '@/modules/subscriptions/service'

export async function upgradeAction(): Promise<void> {
  const context = await requireFamily()
  const { url } = await startCheckout({
    familyId: context.family.id,
    email: context.user.email,
    plan: 'FAMILY_PREMIUM',
  })
  redirect(url)
}

export async function cancelSubscriptionAction(): Promise<void> {
  const context = await requireFamily()
  await cancelPlan(context.family.id, context.user.id)
  revalidatePath('/settings/subscription')
}

export async function resumeSubscriptionAction(): Promise<void> {
  const context = await requireFamily()
  await resumePlan(context.family.id, context.user.id)
  revalidatePath('/settings/subscription')
}
