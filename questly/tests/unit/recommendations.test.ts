import { describe, expect, it } from "vitest";
import type { QuestSummary } from "@/modules/quests/types";
import type { RecommendationContext } from "@/modules/recommendations/types";
import { recommend, scoreQuest, seasonFor } from "@/modules/recommendations/engine";

function quest(overrides: Partial<QuestSummary> = {}): QuestSummary {
  return {
    id: overrides.slug ?? "id",
    slug: "sample-quest",
    title: "Sample",
    summary: "Summary",
    imageKey: "default",
    ageBands: ["AGE_9_11"],
    durationMinutes: 60,
    difficulty: "EASY",
    setting: "BOTH",
    weather: "ANY",
    seasons: ["SPRING", "SUMMER", "AUTUMN", "WINTER"],
    minParticipants: 1,
    maxParticipants: 4,
    isPremium: false,
    requiresAdultSupervision: false,
    safetyLevel: "INFO",
    status: "PUBLISHED",
    category: { slug: "nature", name: "Natuur", colorToken: "--color-cat-nature", icon: "leaf" },
    skills: [{ slug: "curiosity", name: "Nieuwsgierigheid" }],
    materials: [],
    accessible: true,
    ...overrides,
  };
}

function context(overrides: Partial<RecommendationContext> = {}): RecommendationContext {
  return {
    ageBands: ["AGE_9_11"],
    interestCategorySlugs: [],
    interestNamesByCategory: {},
    completedQuestSlugs: [],
    recentCategorySlugs: [],
    recentSkillSlugs: [],
    preferredDurationMinutes: 60,
    preferredDifficulty: "EASY",
    settingPreference: "BOTH",
    availableMaterialSlugs: [],
    familySize: 3,
    season: "SPRING",
    weather: "DRY",
    ...overrides,
  };
}

describe("scoreQuest", () => {
  it("rejects a quest outside the child's age band", () => {
    const result = scoreQuest(quest({ ageBands: ["AGE_12_15"] }), context({ ageBands: ["AGE_6_8"] }));
    expect(result.score).toBeLessThan(0);
    expect(result.reasons).toHaveLength(0);
  });

  it("scores a matching age band and explains why", () => {
    const result = scoreQuest(quest(), context());
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.map((r) => r.code)).toContain("ageBand");
  });

  it("rewards a category the child is interested in", () => {
    const without = scoreQuest(quest(), context());
    const with_ = scoreQuest(
      quest(),
      context({ interestCategorySlugs: ["nature"], interestNamesByCategory: { nature: "Dieren" } }),
    );
    expect(with_.score).toBeGreaterThan(without.score);
    const reason = with_.reasons.find((r) => r.code === "interest");
    expect(reason?.params?.interest).toBe("Dieren");
  });

  it("penalises a quest the family already completed", () => {
    const fresh = scoreQuest(quest(), context());
    const repeat = scoreQuest(quest(), context({ completedQuestSlugs: ["sample-quest"] }));
    expect(repeat.score).toBeLessThan(fresh.score);
  });

  it("prefers quests that fit the available time", () => {
    const short = scoreQuest(quest({ durationMinutes: 45 }), context({ preferredDurationMinutes: 60 }));
    const long = scoreQuest(quest({ durationMinutes: 180 }), context({ preferredDurationMinutes: 60 }));
    expect(short.score).toBeGreaterThan(long.score);
  });

  it("rewards a category the family has not explored recently", () => {
    const explored = scoreQuest(quest(), context({ recentCategorySlugs: ["nature"] }));
    const unexplored = scoreQuest(quest(), context({ recentCategorySlugs: ["cooking"] }));
    expect(unexplored.score).toBeGreaterThan(explored.score);
    expect(unexplored.reasons.map((r) => r.code)).toContain("newCategory");
  });

  it("marks a rainy-afternoon quest as fitting the weather", () => {
    const result = scoreQuest(quest({ weather: "RAIN_FRIENDLY" }), context({ weather: "RAIN_FRIENDLY" }));
    expect(result.reasons.some((r) => r.code === "weather")).toBe(true);
  });

  it("is deterministic", () => {
    const a = scoreQuest(quest(), context());
    const b = scoreQuest(quest(), context());
    expect(a.score).toBe(b.score);
    expect(a.reasons).toEqual(b.reasons);
  });
});

describe("recommend", () => {
  it("never returns a quest outside the age band", () => {
    const results = recommend(
      [
        quest({ slug: "for-teens", ageBands: ["AGE_12_15"] }),
        quest({ slug: "for-youngest", ageBands: ["AGE_6_8"] }),
      ],
      context({ ageBands: ["AGE_6_8"] }),
    );
    expect(results.map((r) => r.quest.slug)).toEqual(["for-youngest"]);
  });

  it("limits how many quests from one category reach the top of the list", () => {
    const quests = Array.from({ length: 6 }, (_, index) =>
      quest({ slug: `nature-${index}`, id: `nature-${index}` }),
    ).concat([quest({ slug: "cooking-1", id: "cooking-1", category: { slug: "cooking", name: "Koken", colorToken: "", icon: "" } })]);

    const results = recommend(quests, context(), 3);
    const natureCount = results.filter((entry) => entry.quest.category.slug === "nature").length;
    expect(natureCount).toBeLessThanOrEqual(2);
  });

  it("ranks a locked premium quest below an accessible one", () => {
    const results = recommend(
      [quest({ slug: "locked", id: "locked", accessible: false }), quest({ slug: "open", id: "open" })],
      context(),
      2,
    );
    expect(results[0]?.quest.slug).toBe("open");
  });
});

describe("seasonFor", () => {
  it("maps months onto seasons", () => {
    expect(seasonFor(new Date("2026-04-15T12:00:00Z"))).toBe("SPRING");
    expect(seasonFor(new Date("2026-07-15T12:00:00Z"))).toBe("SUMMER");
    expect(seasonFor(new Date("2026-10-15T12:00:00Z"))).toBe("AUTUMN");
    expect(seasonFor(new Date("2026-01-15T12:00:00Z"))).toBe("WINTER");
  });
});
