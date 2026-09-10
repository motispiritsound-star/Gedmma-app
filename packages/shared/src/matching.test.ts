import { describe, expect, it } from 'vitest';
import { MATCH_RADIUS_KM, matchPros, requestsForPro, type SignupRecord } from './matching.js';

function record(over: Partial<SignupRecord> & { id: string }): SignupRecord {
  return {
    role: 'PRO',
    email: `${over.id}@example.nl`,
    name: over.id,
    phone: null,
    citySlug: 'utrecht',
    categorySlugs: ['schilderwerk'],
    kvk: '12345678',
    jobNote: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    handledAt: null,
    unsubscribedAt: null,
    ...over,
  };
}

const request = record({
  id: 'klant',
  role: 'CUSTOMER',
  kvk: null,
  citySlug: 'utrecht',
  categorySlugs: ['schilderwerk'],
});

describe('which pros hear about a request', () => {
  it('takes the ones who do the work that was asked for', () => {
    const painter = record({ id: 'schilder' });
    const plumber = record({ id: 'loodgieter', categorySlugs: ['loodgieter'] });
    const matches = matchPros(request, [painter, plumber]);
    expect(matches.map((match) => match.pro.id)).toEqual(['schilder']);
    expect(matches[0]!.sharedCategories).toEqual(['schilderwerk']);
  });

  it('leaves out anybody who asked to be taken off the list', () => {
    const gone = record({ id: 'weg', unsubscribedAt: '2026-02-01T00:00:00.000Z' });
    expect(matchPros(request, [gone])).toEqual([]);
  });

  it('never matches somebody with themselves', () => {
    // One address can sign up as both. Telling them about their own request
    // would be the first thing anybody noticed.
    const both = record({ id: 'zelfde', email: request.email });
    expect(matchPros(request, [both])).toEqual([]);
  });

  it('shows everybody nearby when the request names no trade', () => {
    // Somebody who did not tick a box still has a job. Showing nothing is the
    // one answer that helps nobody.
    const open = { ...request, categorySlugs: [] };
    const painter = record({ id: 'schilder' });
    const plumber = record({ id: 'loodgieter', categorySlugs: ['loodgieter'] });
    expect(matchPros(open, [painter, plumber])).toHaveLength(2);
  });

  it('puts the nearest first and marks who is actually in the neighbourhood', () => {
    const here = record({ id: 'utrecht', citySlug: 'utrecht' });
    const nextDoor = record({ id: 'amersfoort', citySlug: 'amersfoort' });
    const faraway = record({ id: 'groningen', citySlug: 'groningen' });
    const matches = matchPros(request, [faraway, nextDoor, here]);

    expect(matches.map((match) => match.pro.id)).toEqual(['utrecht', 'amersfoort', 'groningen']);
    expect(matches[0]!.distanceKm).toBe(0);
    expect(matches[0]!.nearby).toBe(true);
    expect(matches[2]!.nearby).toBe(false);
    expect(matches[2]!.distanceKm).toBeGreaterThan(MATCH_RADIUS_KM);
  });

  it('prefers the pro who covers more of what was asked', () => {
    const wide = record({ id: 'breed', categorySlugs: ['schilderwerk', 'behangen'] });
    const narrow = record({ id: 'smal', categorySlugs: ['schilderwerk'] });
    const two = { ...request, categorySlugs: ['schilderwerk', 'behangen'] };
    expect(matchPros(two, [narrow, wide]).map((m) => m.pro.id)).toEqual(['breed', 'smal']);
  });

  it('breaks a tie in favour of whoever has been waiting longest', () => {
    const older = record({ id: 'eerst', createdAt: '2026-01-01T00:00:00.000Z' });
    const newer = record({ id: 'later', createdAt: '2026-06-01T00:00:00.000Z' });
    expect(matchPros(request, [newer, older]).map((m) => m.pro.id)).toEqual(['eerst', 'later']);
  });

  it('keeps a pro whose municipality is unknown, but ranks them last', () => {
    const known = record({ id: 'bekend' });
    const unknown = record({ id: 'onbekend', citySlug: null });
    const matches = matchPros(request, [unknown, known]);
    expect(matches.map((m) => m.pro.id)).toEqual(['bekend', 'onbekend']);
    expect(matches[1]!.distanceKm).toBeNull();
    expect(matches[1]!.nearby).toBe(false);
  });

  it('ignores a trade slug that is not in the catalogue', () => {
    // Slugs arrive from a form. One that means nothing must not quietly
    // narrow a request down to nobody.
    const nonsense = { ...request, categorySlugs: ['tovenaar'] };
    expect(matchPros(nonsense, [record({ id: 'schilder' })])).toHaveLength(1);
  });
});

describe('what one pro is waiting for', () => {
  it('counts the open requests that would reach them', () => {
    const pro = record({ id: 'schilder' });
    const open = { ...request, id: 'open' };
    const done = { ...request, id: 'afgehandeld', handledAt: '2026-03-01T00:00:00.000Z' };
    const other = { ...request, id: 'ander', categorySlugs: ['loodgieter'] };

    expect(requestsForPro(pro, [open, done, other]).map((r) => r.id)).toEqual(['open']);
  });
});
