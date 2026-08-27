import { create } from 'zustand';
import type { JobUrgency, PropertyType } from '@khidma/shared';

/**
 * The job-posting wizard spans several screens, so the answers live here rather
 * than being threaded through navigation params. Cleared once the job posts.
 */
export interface JobDraft {
  categorySlug: string | null;
  categoryName: string | null;
  parentCategorySlug: string | null;
  title: string;
  description: string;
  photoUrls: string[];
  citySlug: string | null;
  cityName: string | null;
  district: string;
  addressLine: string;
  propertyType: PropertyType | null;
  urgency: JobUrgency;
  preferredStartDate: string | null;
  budgetMinMad: string;
  budgetMaxMad: string;
}

const EMPTY: JobDraft = {
  categorySlug: null,
  categoryName: null,
  parentCategorySlug: null,
  title: '',
  description: '',
  photoUrls: [],
  citySlug: null,
  cityName: null,
  district: '',
  addressLine: '',
  propertyType: null,
  urgency: 'WITHIN_WEEK',
  preferredStartDate: null,
  budgetMinMad: '',
  budgetMaxMad: '',
};

interface DraftState extends JobDraft {
  update: (patch: Partial<JobDraft>) => void;
  reset: () => void;
  /** Shapes the draft into the payload the API expects. */
  toPayload: () => Record<string, unknown>;
}

export const useJobDraft = create<DraftState>((set, get) => ({
  ...EMPTY,

  update: (patch) => set(patch),
  reset: () => set(EMPTY),

  toPayload() {
    const draft = get();
    const min = Number.parseInt(draft.budgetMinMad, 10);
    const max = Number.parseInt(draft.budgetMaxMad, 10);

    return {
      categorySlug: draft.categorySlug,
      title: draft.title.trim(),
      description: draft.description.trim(),
      citySlug: draft.citySlug,
      district: draft.district.trim() || undefined,
      addressLine: draft.addressLine.trim() || undefined,
      propertyType: draft.propertyType ?? undefined,
      urgency: draft.urgency,
      preferredStartDate: draft.preferredStartDate ?? undefined,
      budgetMinMad: Number.isFinite(min) ? min : undefined,
      budgetMaxMad: Number.isFinite(max) ? max : undefined,
      photoUrls: draft.photoUrls,
    };
  },
}));
