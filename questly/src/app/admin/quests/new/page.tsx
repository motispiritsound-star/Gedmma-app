import type { Metadata } from 'next'
import { QuestEditor } from '@/components/admin/QuestEditor'
import { EMPTY_QUEST } from '@/components/admin/empty-quest'
import { editorLabels } from '@/components/admin/editor-labels'
import { createQuestAction } from '@/app/admin/admin-actions'
import { getTranslations } from '@/modules/localisation/server'
import { requireAdminPage } from '@/modules/auth/guards'
import { listCategories, listSkills } from '@/modules/quests/queries'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'New quest' }

export default async function NewQuestPage() {
  const [{ locale, d }] = await Promise.all([getTranslations(), requireAdminPage()])

  const [categories, skills, materials] = await Promise.all([
    listCategories(locale),
    listSkills(locale),
    prisma.material.findMany({ orderBy: { slug: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{d.admin.newQuest}</h1>
      <QuestEditor
        action={createQuestAction}
        initial={{ ...EMPTY_QUEST, categorySlug: categories[0]?.slug ?? '' }}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        skills={skills.map((s) => ({ slug: s.slug, name: s.name }))}
        materials={materials.map((m) => ({
          slug: m.slug,
          name: locale === 'nl' ? m.nameNl : m.nameEn,
        }))}
        locale={locale}
        labels={editorLabels(d)}
      />
    </div>
  )
}
