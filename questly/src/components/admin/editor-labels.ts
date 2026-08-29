import type { Dictionary } from '@/modules/localisation'

/** Maps the dictionary onto the labels the quest editor needs. */
export function editorLabels(d: Dictionary) {
  return {
    save: d.common.save,
    saving: d.common.saving,
    saved: d.admin.saved,
    slug: d.admin.slug,
    category: d.quest.category,
    ageBand: d.quest.ageBand,
    duration: d.quest.duration,
    difficulty: d.quest.difficulty,
    setting: d.quest.setting,
    weather: d.library.filterWeather,
    participants: d.quest.participants,
    skills: d.quest.skills,
    materials: d.admin.materialsSection,
    safety: d.admin.safetySection,
    steps: d.admin.stepsSection,
    translations: d.admin.translations,
    imageKey: d.admin.imageKey,
    preview: d.common.preview,
    addStep: d.common.create,
    removeStep: d.common.delete,
    addSafety: d.common.create,
    addMaterial: d.common.create,
    changeNote: d.admin.versionHistory,
    premium: d.common.premium,
    requiresAdult: d.quest.safetyAdult,
    preparation: d.quest.preparation,
    reflection: d.quest.reflection,
  }
}
