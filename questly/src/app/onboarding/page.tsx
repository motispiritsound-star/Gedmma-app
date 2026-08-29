import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/family/OnboardingWizard'
import { getTranslations } from '@/modules/localisation/server'
import { requireFamilyPage } from '@/modules/auth/guards'
import { listChildProfiles } from '@/modules/families/service'
import { listInterests } from '@/modules/quests/queries'

export const metadata: Metadata = { title: 'Set up your family' }

export default async function OnboardingPage() {
  const [{ locale, d }, context] = await Promise.all([
    getTranslations(),
    requireFamilyPage('/onboarding'),
  ])

  if (context.family.onboardingCompletedAt) redirect('/home')

  const [children, interests] = await Promise.all([
    listChildProfiles(context.family.id),
    listInterests(locale),
  ])

  return (
    <OnboardingWizard
      locale={locale}
      family={{
        name: context.family.name,
        environment: context.family.environment,
        adultCount: context.family.adultCount,
        preferredDuration: context.family.preferredDuration,
        preferredDifficulty: context.family.preferredDifficulty,
        preferredSetting: context.family.preferredSetting,
        prefersFamilyActivity: context.family.prefersFamilyActivity,
        requireParentApproval: context.family.requireParentApproval,
        locale: context.family.locale,
      }}
      childProfiles={children.map((child) => ({
        id: child.id,
        nickname: child.nickname,
        ageBand: child.ageBand,
        avatarKey: child.avatarKey,
        interestIds: child.interests.map((link) => link.interestId),
      }))}
      interests={interests.map((interest) => ({ id: interest.id, name: interest.name }))}
      maxChildProfiles={context.entitlements.maxChildProfiles}
      d={{
        title: d.onboarding.title,
        stepFamily: d.onboarding.stepFamily,
        stepChildren: d.onboarding.stepChildren,
        stepPreferences: d.onboarding.stepPreferences,
        familyName: d.auth.familyName,
        familyNameHint: d.auth.familyNameHint,
        environment: d.onboarding.environment,
        environmentHint: d.onboarding.environmentHint,
        adults: d.onboarding.stepFamily,
        duration: d.onboarding.duration,
        difficulty: d.onboarding.difficulty,
        setting: d.onboarding.setting,
        familyActivity: d.onboarding.familyActivity,
        approval: d.onboarding.approval,
        approvalHint: d.onboarding.approvalHint,
        addChild: d.onboarding.addChild,
        noChildrenYet: d.onboarding.noChildrenYet,
        finishTitle: d.onboarding.finishTitle,
        goToHome: d.onboarding.goToHome,
        back: d.common.back,
        next: d.common.next,
        saving: d.common.saving,
        nickname: d.onboarding.childNickname,
        nicknameHint: d.onboarding.childNicknameHint,
        ageBand: d.onboarding.ageBand,
        avatar: d.onboarding.childAvatar,
        interests: d.onboarding.interests,
        interestsHint: d.onboarding.interestsHint,
        save: d.common.save,
        cancel: d.common.cancel,
        limitReached: d.children.limitReached,
      }}
    />
  )
}
