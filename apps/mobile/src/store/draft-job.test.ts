import { beforeEach, describe, expect, it } from 'vitest';
import { useJobDraft } from './draft-job';

describe('the job posting draft', () => {
  beforeEach(() => {
    useJobDraft.getState().reset();
  });

  it('starts empty with a sensible default urgency', () => {
    const draft = useJobDraft.getState();
    expect(draft.categorySlug).toBeNull();
    expect(draft.photoUrls).toEqual([]);
    expect(draft.urgency).toBe('WITHIN_WEEK');
  });

  it('shapes the answers into the payload the API expects', () => {
    useJobDraft.getState().update({
      categorySlug: 'peinture-interieure',
      title: '  Peindre un salon  ',
      description: '  Salon de 25 m² à repeindre en blanc mat.  ',
      citySlug: 'casablanca',
      district: 'Maârif',
      budgetMinMad: '3000',
      budgetMaxMad: '6000',
    });

    const payload = useJobDraft.getState().toPayload();
    expect(payload.title).toBe('Peindre un salon');
    expect(payload.description).toBe('Salon de 25 m² à repeindre en blanc mat.');
    expect(payload.budgetMinMad).toBe(3000);
    expect(payload.budgetMaxMad).toBe(6000);
    expect(payload.district).toBe('Maârif');
  });

  it('omits the budget and the optional text fields when left blank', () => {
    useJobDraft.getState().update({
      categorySlug: 'plomberie',
      title: 'Fuite sous évier',
      description: 'Une fuite est apparue sous l’évier de la cuisine.',
      citySlug: 'rabat',
    });

    const payload = useJobDraft.getState().toPayload();
    expect(payload.budgetMinMad).toBeUndefined();
    expect(payload.budgetMaxMad).toBeUndefined();
    expect(payload.district).toBeUndefined();
    expect(payload.addressLine).toBeUndefined();
  });

  it('clears everything once the job has been posted', () => {
    useJobDraft.getState().update({ title: 'Quelque chose', photoUrls: ['file:///a.jpg'] });
    useJobDraft.getState().reset();
    expect(useJobDraft.getState().title).toBe('');
    expect(useJobDraft.getState().photoUrls).toEqual([]);
  });
});
