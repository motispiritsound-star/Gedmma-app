import type { QuestSeed } from "./quest-types";
import { NATURE_AND_SCIENCE_QUESTS } from "./quests-nature-science";
import { MOVEMENT_CREATIVE_COOKING_QUESTS } from "./quests-movement-creative-cooking";
import { PRACTICAL_AND_ENTERPRISE_QUESTS } from "./quests-practical-enterprise";
import { FAMILY_COMMUNITY_HISTORY_QUESTS } from "./quests-family-community-history";

export * from "./taxonomy";
export * from "./quest-types";

export const QUESTS: QuestSeed[] = [
  ...NATURE_AND_SCIENCE_QUESTS,
  ...MOVEMENT_CREATIVE_COOKING_QUESTS,
  ...PRACTICAL_AND_ENTERPRISE_QUESTS,
  ...FAMILY_COMMUNITY_HISTORY_QUESTS,
];
