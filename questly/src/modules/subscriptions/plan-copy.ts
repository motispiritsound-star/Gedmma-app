import type { SubscriptionPlan } from "@prisma/client";
import type { AppLocale } from "@/modules/i18n";

type Copy = { name: string; price: string; tagline: string; features: string[]; caveats?: string[] };

const COPY: Record<SubscriptionPlan, Record<AppLocale, Copy>> = {
  FREE: {
    nl: {
      name: "Gratis",
      price: "€ 0",
      tagline: "Om te proberen of Questly bij jullie past.",
      features: [
        "Wisselende selectie van twaalf quests per week",
        "Een kindprofiel",
        "Basisvoortgang en badges",
        "Avontuurmodus met voorleesfunctie",
      ],
      caveats: ["Geen weekplanner", "Geen certificaten"],
    },
    en: {
      name: "Free",
      price: "€ 0",
      tagline: "To find out whether Questly suits your family.",
      features: [
        "A rotating selection of twelve quests each week",
        "One child profile",
        "Basic progress and badges",
        "Adventure Mode with read-aloud",
      ],
      caveats: ["No weekly planner", "No certificates"],
    },
  },
  FAMILY_PREMIUM: {
    nl: {
      name: "Family Premium",
      price: "€ 6,99 per maand",
      tagline: "De hele bibliotheek voor het hele gezin.",
      features: [
        "Alle quests, ook de premium avonturen",
        "Tot vijf kindprofielen",
        "Weekplanner",
        "Persoonlijke aanbevelingen met uitleg",
        "Certificaat om af te drukken",
        "Prive gezinsherinneringen",
      ],
    },
    en: {
      name: "Family Premium",
      price: "€ 6.99 per month",
      tagline: "The full library for the whole family.",
      features: [
        "Every quest, including the premium adventures",
        "Up to five child profiles",
        "Weekly planner",
        "Personalised recommendations with reasons",
        "Printable certificate",
        "Private family memories",
      ],
    },
  },
  SCHOOL: {
    nl: {
      name: "School",
      price: "Op aanvraag",
      tagline: "Nog niet beschikbaar. De architectuur is voorbereid.",
      features: ["Klaslicenties", "Klasuitdagingen", "Docentendashboard"],
      caveats: ["Niet gebouwd in deze MVP. Zie FUTURE_MODULES.md (FocusSchool)."],
    },
    en: {
      name: "School",
      price: "On request",
      tagline: "Not available yet. The architecture is prepared.",
      features: ["Class licences", "Class challenges", "Teacher dashboard"],
      caveats: ["Not built in this MVP. See FUTURE_MODULES.md (FocusSchool)."],
    },
  },
};

export function planCopy(plan: SubscriptionPlan, locale: AppLocale): Copy {
  return COPY[plan][locale];
}

export const PUBLIC_PLANS: SubscriptionPlan[] = ["FREE", "FAMILY_PREMIUM", "SCHOOL"];
