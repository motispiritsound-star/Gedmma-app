-- A family-level badge has a NULL childProfileId, and PostgreSQL treats NULLs as
-- distinct in a unique index. These partial indexes make "award once" an actual
-- database guarantee for both the family-level and the per-child case.
CREATE UNIQUE INDEX "AwardedBadge_family_unique"
  ON "AwardedBadge" ("badgeId", "familyId")
  WHERE "childProfileId" IS NULL;

CREATE UNIQUE INDEX "AwardedBadge_child_unique"
  ON "AwardedBadge" ("badgeId", "childProfileId")
  WHERE "childProfileId" IS NOT NULL;
