import { describe, expect, it } from 'vitest';
import { auditCopy, contentCopy, suggestionsForAge } from '@focusfamily/domain';
import { ACTIVITY_SUGGESTIONS, EDUCATIONAL_ARTICLES } from '../src/content.js';

describe('the library content', () => {
  const copy = contentCopy({
    activities: ACTIVITY_SUGGESTIONS,
    articles: EDUCATIONAL_ARTICLES,
  });

  it('contains no clinical framing and no shaming, in either language', () => {
    const violations = auditCopy(copy);
    expect(
      violations,
      violations.map((v) => `${v.key}: "${v.term}" (${v.list})`).join('\n'),
    ).toEqual([]);
  });

  it('covers the four topics the product promises, plus school and privacy', () => {
    const topics = new Set(EDUCATIONAL_ARTICLES.map((article) => article.topic));
    for (const topic of ['social_media', 'gaming', 'sleep', 'conversations', 'school', 'privacy']) {
      expect(topics, topic).toContain(topic);
    }
  });

  it('says where every article got its guidance from', () => {
    for (const article of EDUCATIONAL_ARTICLES) {
      expect(article.sourceNote.nl.length).toBeGreaterThan(20);
      expect(article.sourceNote.en.length).toBeGreaterThan(20);
      expect(article.body.nl.length).toBe(article.body.en.length);
    }
  });

  it('has a Dutch and an English version of every string', () => {
    for (const [key, value] of Object.entries(copy)) {
      expect(value.trim().length, key).toBeGreaterThan(0);
    }
    expect(Object.keys(copy).filter((k) => k.endsWith(':nl')).length).toBeGreaterThan(0);
  });

  it('offers free activities for a nine year old without any paid pack', () => {
    const free = suggestionsForAge(ACTIVITY_SUGGESTIONS, 9, { includeExtraPacks: false });
    expect(free.length).toBeGreaterThanOrEqual(6);
    expect(free.every((activity) => activity.pack === 'core')).toBe(true);
  });

  it('unlocks extra packs when the family has them', () => {
    const all = suggestionsForAge(ACTIVITY_SUGGESTIONS, 12, { includeExtraPacks: true });
    const core = suggestionsForAge(ACTIVITY_SUGGESTIONS, 12, { includeExtraPacks: false });
    expect(all.length).toBeGreaterThan(core.length);
  });

  it('keeps the Questly hook inert in this MVP', () => {
    expect(ACTIVITY_SUGGESTIONS.every((activity) => activity.questlyRef === null)).toBe(true);
  });
});
