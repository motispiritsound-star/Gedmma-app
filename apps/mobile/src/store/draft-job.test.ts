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
      categorySlug: 'binnenschilderwerk',
      title: '  Woonkamer schilderen  ',
      description: '  Woonkamer van 25 m² schilderen in gebroken wit.  ',
      citySlug: 'utrecht',
      district: 'Wittevrouwen',
      budgetMinEur: '3000',
      budgetMaxEur: '6000',
    });

    const payload = useJobDraft.getState().toPayload();
    expect(payload.title).toBe('Woonkamer schilderen');
    expect(payload.description).toBe('Woonkamer van 25 m² schilderen in gebroken wit.');
    expect(payload.budgetMinEur).toBe(3000);
    expect(payload.budgetMaxEur).toBe(6000);
    expect(payload.district).toBe('Wittevrouwen');
  });

  it('omits the budget and the optional text fields when left blank', () => {
    useJobDraft.getState().update({
      categorySlug: 'loodgieter',
      title: 'Lekkage onder de gootsteen',
      description: 'Er lekt water onder de gootsteen in de keuken.',
      citySlug: 'amersfoort',
    });

    const payload = useJobDraft.getState().toPayload();
    expect(payload.budgetMinEur).toBeUndefined();
    expect(payload.budgetMaxEur).toBeUndefined();
    expect(payload.district).toBeUndefined();
    expect(payload.addressLine).toBeUndefined();
  });

  it('clears everything once the job has been posted', () => {
    useJobDraft.getState().update({ title: 'Iets', photoUrls: ['file:///a.jpg'] });
    useJobDraft.getState().reset();
    expect(useJobDraft.getState().title).toBe('');
    expect(useJobDraft.getState().photoUrls).toEqual([]);
  });
});
