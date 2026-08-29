import Link from "next/link";
import { Card } from "@/components/ui/primitives";
import type { Translate } from "@/modules/i18n";
import type { QuestFilters } from "@/modules/quests/types";

type Option = { value: string; label: string };

function SelectFilter({
  id,
  name,
  label,
  value,
  options,
  allLabel,
}: {
  id: string;
  name: string;
  label: string;
  value?: string;
  options: Option[];
  allLabel: string;
}) {
  return (
    <div>
      <label className="q-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} name={name} defaultValue={value ?? ""} className="q-field">
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Filters are a plain GET form: they work without JavaScript, the resulting URL
 * is shareable, and the back button behaves the way people expect.
 */
export function QuestFiltersPanel({
  t,
  filters,
  categories,
  skills,
  materials,
}: {
  t: Translate;
  filters: QuestFilters;
  categories: { slug: string; name: string }[];
  skills: { slug: string; name: string }[];
  materials: { slug: string; name: string }[];
}) {
  return (
    <Card as="section" className="p-4">
      {/* Collapsed on narrow screens so the results are not pushed off the
          first screen; always open from the large breakpoint up (see globals.css). */}
      <details className="q-filters">
        <summary className="q-btn q-btn--secondary w-full cursor-pointer list-none">{t("quests.filters")}</summary>
        <h2 className="q-filters__heading mb-3 text-lg">{t("quests.filters")}</h2>
        <form method="get" action="/quests" className="q-filters__body grid gap-3">
        <div>
          <label className="q-label" htmlFor="search">
            {t("common.search")}
          </label>
          <input id="search" name="search" type="search" defaultValue={filters.search ?? ""} className="q-field" />
        </div>

        <SelectFilter
          id="ageBand"
          name="ageBand"
          label={t("quests.filter.ageBand")}
          value={filters.ageBand}
          allLabel={t("common.all")}
          options={(["AGE_6_8", "AGE_9_11", "AGE_12_15"] as const).map((band) => ({
            value: band,
            label: t(`ageBand.${band}`),
          }))}
        />

        <SelectFilter
          id="maxDurationMinutes"
          name="maxDurationMinutes"
          label={t("quests.filter.duration")}
          value={filters.maxDurationMinutes ? String(filters.maxDurationMinutes) : undefined}
          allLabel={t("common.all")}
          options={[30, 45, 60, 90, 120].map((minutes) => ({
            value: String(minutes),
            label: t("quest.minutes", { count: minutes }),
          }))}
        />

        <SelectFilter
          id="setting"
          name="setting"
          label={t("quests.filter.setting")}
          value={filters.setting}
          allLabel={t("common.all")}
          options={(["INDOOR", "OUTDOOR"] as const).map((setting) => ({
            value: setting,
            label: t(`setting.${setting}`),
          }))}
        />

        <SelectFilter
          id="weather"
          name="weather"
          label={t("quests.filter.weather")}
          value={filters.weather}
          allLabel={t("common.all")}
          options={(["DRY", "RAIN_FRIENDLY", "WARM", "COLD"] as const).map((weather) => ({
            value: weather,
            label: t(`weather.${weather}`),
          }))}
        />

        <div>
          <label className="q-label" htmlFor="participants">
            {t("quests.filter.participants")}
          </label>
          <input
            id="participants"
            name="participants"
            type="number"
            min={1}
            max={20}
            defaultValue={filters.participants ?? ""}
            className="q-field"
          />
        </div>

        <SelectFilter
          id="categorySlug"
          name="categorySlug"
          label={t("quests.filter.category")}
          value={filters.categorySlug}
          allLabel={t("common.all")}
          options={categories.map((category) => ({ value: category.slug, label: category.name }))}
        />

        <SelectFilter
          id="skillSlug"
          name="skillSlug"
          label={t("quests.filter.skill")}
          value={filters.skillSlug}
          allLabel={t("common.all")}
          options={skills.map((skill) => ({ value: skill.slug, label: skill.name }))}
        />

        <SelectFilter
          id="difficulty"
          name="difficulty"
          label={t("quests.filter.difficulty")}
          value={filters.difficulty}
          allLabel={t("common.all")}
          options={(["EASY", "MEDIUM", "CHALLENGING"] as const).map((level) => ({
            value: level,
            label: t(`difficulty.${level}`),
          }))}
        />

        <SelectFilter
          id="materialSlug"
          name="materialSlug"
          label={t("quests.filter.material")}
          value={filters.materialSlug}
          allLabel={t("common.all")}
          options={materials.map((material) => ({ value: material.slug, label: material.name }))}
        />

        <SelectFilter
          id="access"
          name="access"
          label={t("quests.filter.access")}
          value={filters.access}
          allLabel={t("common.all")}
          options={[
            { value: "free", label: t("quest.free") },
            { value: "premium", label: t("quest.premium") },
          ]}
        />

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" className="q-btn q-btn--primary">
              {t("quests.filter.apply")}
            </button>
            <Link href="/quests" className="q-btn q-btn--ghost">
              {t("quests.filter.reset")}
            </Link>
          </div>
        </form>
      </details>
    </Card>
  );
}
