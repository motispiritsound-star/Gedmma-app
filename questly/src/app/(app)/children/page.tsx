import type { Metadata } from 'next'
import Link from 'next/link'
import { Callout } from '@/components/ui/States'
import { ChildProfileManager } from '@/components/family/ChildProfileManager'
import { fill } from '@/modules/localisation'
import { getTranslations } from '@/modules/localisation/server'
import { requireFamilyPage } from '@/modules/auth/guards'
import { listChildProfiles } from '@/modules/families/service'
import { listInterests } from '@/modules/quests/queries'

export const metadata: Metadata = { title: 'Child profiles' }

export default async function ChildrenPage() {
  const [{ locale, d }, context] = await Promise.all([
    getTranslations(),
    requireFamilyPage('/children'),
  ])

  const [children, interests] = await Promise.all([
    listChildProfiles(context.family.id),
    listInterests(locale),
  ])

  const atLimit = children.length >= context.entitlements.maxChildProfiles

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{d.children.title}</h1>
        <p className="mt-1 text-ink-soft">{d.children.subtitle}</p>
      </header>

      {atLimit ? (
        <Callout tone="info">
          {fill(d.children.limitReached, { limit: context.entitlements.maxChildProfiles })}{' '}
          <Link href="/settings/subscription">{d.children.upgradeForMore}</Link>
        </Callout>
      ) : null}

      <ChildProfileManager
        childProfiles={children.map((child) => ({
          id: child.id,
          nickname: child.nickname,
          ageBand: child.ageBand,
          avatarKey: child.avatarKey,
          interestIds: child.interests.map((link) => link.interestId),
        }))}
        interests={interests.map((interest) => ({ id: interest.id, name: interest.name }))}
        locale={locale}
        canAdd={!atLimit}
        labels={{
          add: d.children.add,
          edit: d.children.edit,
          remove: d.children.remove,
          removeConfirm: d.children.removeConfirm,
          nickname: d.onboarding.childNickname,
          nicknameHint: d.onboarding.childNicknameHint,
          ageBand: d.onboarding.ageBand,
          avatar: d.onboarding.childAvatar,
          interests: d.onboarding.interests,
          interestsHint: d.onboarding.interestsHint,
          save: d.common.save,
          cancel: d.common.cancel,
          saving: d.common.saving,
          empty: d.onboarding.noChildrenYet,
        }}
      />
    </div>
  )
}
