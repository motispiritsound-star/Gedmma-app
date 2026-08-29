import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { QuestEditor } from '@/components/admin/QuestEditor'
import { QuestRowActions } from '@/components/admin/QuestRowActions'
import { editorLabels } from '@/components/admin/editor-labels'
import { updateQuestAction } from '@/app/admin/admin-actions'
import { getTranslations } from '@/modules/localisation/server'
import { formatDate } from '@/modules/localisation/format'
import { requireAdminPage } from '@/modules/auth/guards'
import { listQuestVersions } from '@/modules/admin/quests'
import { getQuestById, listCategories, listSkills } from '@/modules/quests/queries'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit quest' }

export default async function EditQuestPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ locale, d }, , { id }] = await Promise.all([
    getTranslations(),
    requireAdminPage(),
    params,
  ])

  const quest = await getQuestById(id)
  if (!quest) notFound()

  const [categories, skills, materials, versions] = await Promise.all([
    listCategories(locale),
    listSkills(locale),
    prisma.material.findMany({ orderBy: { slug: 'asc' } }),
    listQuestVersions(id),
  ])

  const translation = (target: 'en' | 'nl') => {
    const row = quest.translations.find((item) => item.locale === target)
    return {
      title: row?.title ?? '',
      shortDescription: row?.shortDescription ?? '',
      story: row?.story ?? '',
      educationalObjective: row?.educationalObjective ?? '',
      expectedResult: row?.expectedResult ?? '',
      preparation: row?.preparation ?? [],
      reflectionQuestions: row?.reflectionQuestions ?? [],
    }
  }

  const stepTranslation = (
    step: (typeof quest.steps)[number],
    target: 'en' | 'nl',
  ) => {
    const row = step.translations.find((item) => item.locale === target)
    return {
      title: row?.title ?? '',
      instruction: row?.instruction ?? '',
      audioScript: row?.audioScript ?? null,
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{d.admin.editQuest}</h1>
          <p className="mt-1 text-sm text-ink-muted">{quest.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={quest.status === 'PUBLISHED' ? 'success' : 'neutral'}>{quest.status}</Badge>
          <QuestRowActions
            questId={quest.id}
            status={quest.status}
            labels={{
              publish: d.admin.publish,
              unpublish: d.admin.unpublish,
              archive: d.admin.archive,
              restore: d.admin.restore,
              duplicate: d.common.duplicate,
            }}
          />
        </div>
      </header>

      <QuestEditor
        action={updateQuestAction}
        questId={quest.id}
        initial={{
          slug: quest.slug,
          categorySlug: quest.category.slug,
          ageBands: quest.ageBands,
          durationMinutes: quest.durationMinutes,
          difficulty: quest.difficulty,
          setting: quest.setting,
          weather: quest.weather,
          seasons: quest.seasons,
          minParticipants: quest.minParticipants,
          maxParticipants: quest.maxParticipants,
          requiresAdult: quest.requiresAdult,
          isPremium: quest.isPremium,
          imageKey: quest.imageKey,
          skillSlugs: quest.skills.map((entry) => entry.skill.slug),
          materials: quest.materials.map((entry) => ({
            slug: entry.material.slug,
            quantity: entry.quantity,
            optional: entry.optional,
          })),
          safety: quest.safety.map((entry) => ({
            position: entry.position,
            severity: entry.severity,
            textEn: entry.textEn,
            textNl: entry.textNl,
          })),
          steps: quest.steps.map((step) => ({
            position: step.position,
            estimatedMinutes: step.estimatedMinutes,
            requiresAdult: step.requiresAdult,
            en: stepTranslation(step, 'en'),
            nl: stepTranslation(step, 'nl'),
          })),
          en: translation('en'),
          nl: translation('nl'),
        }}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        skills={skills.map((s) => ({ slug: s.slug, name: s.name }))}
        materials={materials.map((m) => ({
          slug: m.slug,
          name: locale === 'nl' ? m.nameNl : m.nameEn,
        }))}
        locale={locale}
        labels={editorLabels(d)}
      />

      <Card>
        <CardHeader title={d.admin.versionHistory} />
        {versions.length === 0 ? (
          <p className="text-sm text-ink-soft">—</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper-sunken px-4 py-2"
              >
                <span className="font-semibold">v{version.version}</span>
                <span className="text-ink-soft">{version.changeNote ?? '—'}</span>
                <span className="text-ink-muted">
                  {version.changedByUser?.displayName ?? '—'} ·{' '}
                  {formatDate(version.createdAt, locale)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}
