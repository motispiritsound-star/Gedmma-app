import { describe, expect, it } from "vitest";
import { createTranslator, en, negotiateLocale, nl, parseLocale, pickText, toDbLocale } from "@/modules/i18n";

describe("dictionaries", () => {
  it("define the same keys in Dutch and English", () => {
    const nlKeys = Object.keys(nl).sort();
    const enKeys = Object.keys(en).sort();
    expect(enKeys).toEqual(nlKeys);
  });

  it("has no empty translation", () => {
    for (const [key, value] of Object.entries({ ...nl, ...en })) {
      expect(value, `empty value for ${key}`).not.toBe("");
    }
  });

  it("uses the same placeholders in both languages", () => {
    const placeholders = (value: string) => (value.match(/\{(\w+)\}/g) ?? []).sort();
    for (const key of Object.keys(nl) as (keyof typeof nl)[]) {
      expect(placeholders(en[key]), `placeholder mismatch for ${key}`).toEqual(placeholders(nl[key]));
    }
  });
});

describe("createTranslator", () => {
  it("renders Dutch and English variants of the same key", () => {
    expect(createTranslator("nl")("nav.library")).toBe("Questbibliotheek");
    expect(createTranslator("en")("nav.library")).toBe("Quest library");
  });

  it("interpolates parameters", () => {
    expect(createTranslator("en")("quest.minutes", { count: 45 })).toBe("45 min");
    expect(createTranslator("nl")("onboarding.step", { current: 2, total: 3 })).toBe("Stap 2 van 3");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(createTranslator("nl")("quest.minutes", {})).toBe("{count} min");
  });
});

describe("locale helpers", () => {
  it("maps app locales onto the database enum", () => {
    expect(toDbLocale("nl")).toBe("NL");
    expect(toDbLocale("en")).toBe("EN");
  });

  it("picks the localised column", () => {
    expect(pickText("nl", "Natuur", "Nature")).toBe("Natuur");
    expect(pickText("en", "Natuur", "Nature")).toBe("Nature");
  });

  it("rejects unknown locale values", () => {
    expect(parseLocale("de")).toBeNull();
    expect(parseLocale("nl")).toBe("nl");
  });

  it("negotiates from Accept-Language and falls back to Dutch", () => {
    expect(negotiateLocale("en-GB,en;q=0.9")).toBe("en");
    expect(negotiateLocale("nl-NL,nl;q=0.9,en;q=0.8")).toBe("nl");
    expect(negotiateLocale("de-DE")).toBe("nl");
    expect(negotiateLocale(null)).toBe("nl");
  });
});
