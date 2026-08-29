-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'CONTENT_ADMIN', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('OWNER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('NL', 'EN');

-- CreateEnum
CREATE TYPE "AgeBand" AS ENUM ('AGE_6_8', 'AGE_9_11', 'AGE_12_15');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'CHALLENGING');

-- CreateEnum
CREATE TYPE "Setting" AS ENUM ('INDOOR', 'OUTDOOR', 'BOTH');

-- CreateEnum
CREATE TYPE "WeatherSuitability" AS ENUM ('ANY', 'DRY', 'RAIN_FRIENDLY', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('CITY', 'SUBURB', 'RURAL');

-- CreateEnum
CREATE TYPE "ParticipationStyle" AS ENUM ('FAMILY', 'INDIVIDUAL', 'BOTH');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SafetySeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('IN_PROGRESS', 'AWAITING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvidenceVisibility" AS ENUM ('PRIVATE', 'FAMILY');

-- CreateEnum
CREATE TYPE "BadgeCriteria" AS ENUM ('QUESTS_COMPLETED', 'CATEGORY_COMPLETED', 'SKILL_PRACTISED', 'CATEGORIES_EXPLORED', 'REFLECTIONS_WRITTEN');

-- CreateEnum
CREATE TYPE "BadgeScope" AS ENUM ('FAMILY', 'CHILD');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'FAMILY_PREMIUM', 'SCHOOL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentProviderKind" AS ENUM ('MOCK', 'STRIPE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARENT',
    "locale" "Locale" NOT NULL DEFAULT 'NL',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'NL',
    "country" TEXT NOT NULL DEFAULT 'NL',
    "environment" "Environment" NOT NULL DEFAULT 'SUBURB',
    "requireParentApproval" BOOLEAN NOT NULL DEFAULT true,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyPreference" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "preferredDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "preferredDifficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "settingPreference" "Setting" NOT NULL DEFAULT 'BOTH',
    "participationStyle" "ParticipationStyle" NOT NULL DEFAULT 'BOTH',
    "availableMaterialSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarKey" TEXT NOT NULL DEFAULT 'fox',
    "ageBand" "AgeBand" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '*',
    "categoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildInterest" (
    "childProfileId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildInterest_pkey" PRIMARY KEY ("childProfileId","interestId")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionNl" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "colorToken" TEXT NOT NULL DEFAULT '--q-category-default',
    "icon" TEXT NOT NULL DEFAULT 'compass',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionNl" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'spark',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "commonlyAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "status" "QuestStatus" NOT NULL DEFAULT 'DRAFT',
    "ageBands" "AgeBand"[],
    "seasons" "Season"[] DEFAULT ARRAY['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']::"Season"[],
    "durationMinutes" INTEGER NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "setting" "Setting" NOT NULL,
    "weather" "WeatherSuitability" NOT NULL DEFAULT 'ANY',
    "minParticipants" INTEGER NOT NULL DEFAULT 1,
    "maxParticipants" INTEGER NOT NULL DEFAULT 6,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "requiresAdultSupervision" BOOLEAN NOT NULL DEFAULT false,
    "safetyLevel" "SafetySeverity" NOT NULL DEFAULT 'INFO',
    "imageKey" TEXT NOT NULL DEFAULT 'default',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestTranslation" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "educationalObjective" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "preparation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audioScript" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestStep" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "durationMinutes" INTEGER,
    "requiresParent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestStepTranslation" (
    "id" TEXT NOT NULL,
    "questStepId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestStepTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestSkill" (
    "questId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuestSkill_pkey" PRIMARY KEY ("questId","skillId")
);

-- CreateTable
CREATE TABLE "QuestMaterial" (
    "questId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" TEXT,
    "optional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestMaterial_pkey" PRIMARY KEY ("questId","materialId")
);

-- CreateTable
CREATE TABLE "SafetyInstruction" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "severity" "SafetySeverity" NOT NULL DEFAULT 'INFO',
    "textNl" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReflectionQuestion" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "textNl" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReflectionQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestVersion" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeNote" TEXT,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestCompletion" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "status" "CompletionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "rejectionReason" TEXT,
    "minutesSpent" INTEGER NOT NULL DEFAULT 0,
    "familyNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestParticipation" (
    "id" TEXT NOT NULL,
    "questCompletionId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletionReflection" (
    "id" TEXT NOT NULL,
    "questCompletionId" TEXT NOT NULL,
    "reflectionQuestionId" TEXT,
    "prompt" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompletionReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletionEvidence" (
    "id" TEXT NOT NULL,
    "questCompletionId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "visibility" "EvidenceVisibility" NOT NULL DEFAULT 'PRIVATE',
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CompletionEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionNl" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'medal',
    "scope" "BadgeScope" NOT NULL DEFAULT 'FAMILY',
    "criteria" "BadgeCriteria" NOT NULL,
    "threshold" INTEGER NOT NULL DEFAULT 1,
    "categoryId" TEXT,
    "skillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardedBadge" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childProfileId" TEXT,
    "scopeKey" TEXT NOT NULL,
    "questCompletionId" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AwardedBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavouriteQuest" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavouriteQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedQuest" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "scheduledFor" DATE NOT NULL,
    "timeOfDay" TEXT,
    "note" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedQuestChild" (
    "plannedQuestId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,

    CONSTRAINT "PlannedQuestChild_pkey" PRIMARY KEY ("plannedQuestId","childProfileId")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" "PaymentProviderKind" NOT NULL DEFAULT 'MOCK',
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "familyId" TEXT,
    "ipHash" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT,
    "reason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledPurgeAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "purgedAt" TIMESTAMP(3),

    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

-- CreateIndex
CREATE INDEX "Family_deletedAt_idx" ON "Family"("deletedAt");

-- CreateIndex
CREATE INDEX "FamilyMembership_familyId_idx" ON "FamilyMembership"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMembership_userId_familyId_key" ON "FamilyMembership"("userId", "familyId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyPreference_familyId_key" ON "FamilyPreference"("familyId");

-- CreateIndex
CREATE INDEX "ChildProfile_familyId_deletedAt_idx" ON "ChildProfile"("familyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_familyId_nickname_key" ON "ChildProfile"("familyId", "nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_slug_key" ON "Interest"("slug");

-- CreateIndex
CREATE INDEX "ChildInterest_interestId_idx" ON "ChildInterest"("interestId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Material_slug_key" ON "Material"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Quest_slug_key" ON "Quest"("slug");

-- CreateIndex
CREATE INDEX "Quest_status_isPremium_idx" ON "Quest"("status", "isPremium");

-- CreateIndex
CREATE INDEX "Quest_categoryId_idx" ON "Quest"("categoryId");

-- CreateIndex
CREATE INDEX "Quest_difficulty_idx" ON "Quest"("difficulty");

-- CreateIndex
CREATE INDEX "Quest_durationMinutes_idx" ON "Quest"("durationMinutes");

-- CreateIndex
CREATE UNIQUE INDEX "QuestTranslation_questId_locale_key" ON "QuestTranslation"("questId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "QuestStep_questId_position_key" ON "QuestStep"("questId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QuestStepTranslation_questStepId_locale_key" ON "QuestStepTranslation"("questStepId", "locale");

-- CreateIndex
CREATE INDEX "QuestSkill_skillId_idx" ON "QuestSkill"("skillId");

-- CreateIndex
CREATE INDEX "QuestMaterial_materialId_idx" ON "QuestMaterial"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyInstruction_questId_position_key" ON "SafetyInstruction"("questId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ReflectionQuestion_questId_position_key" ON "ReflectionQuestion"("questId", "position");

-- CreateIndex
CREATE INDEX "QuestVersion_questId_idx" ON "QuestVersion"("questId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestVersion_questId_version_key" ON "QuestVersion"("questId", "version");

-- CreateIndex
CREATE INDEX "QuestCompletion_familyId_status_idx" ON "QuestCompletion"("familyId", "status");

-- CreateIndex
CREATE INDEX "QuestCompletion_questId_idx" ON "QuestCompletion"("questId");

-- CreateIndex
CREATE INDEX "QuestCompletion_familyId_finishedAt_idx" ON "QuestCompletion"("familyId", "finishedAt");

-- CreateIndex
CREATE INDEX "QuestParticipation_childProfileId_idx" ON "QuestParticipation"("childProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestParticipation_questCompletionId_childProfileId_key" ON "QuestParticipation"("questCompletionId", "childProfileId");

-- CreateIndex
CREATE INDEX "CompletionReflection_questCompletionId_idx" ON "CompletionReflection"("questCompletionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletionEvidence_storageKey_key" ON "CompletionEvidence"("storageKey");

-- CreateIndex
CREATE INDEX "CompletionEvidence_questCompletionId_idx" ON "CompletionEvidence"("questCompletionId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_slug_key" ON "Badge"("slug");

-- CreateIndex
CREATE INDEX "AwardedBadge_familyId_idx" ON "AwardedBadge"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "AwardedBadge_familyId_badgeId_scopeKey_key" ON "AwardedBadge"("familyId", "badgeId", "scopeKey");

-- CreateIndex
CREATE INDEX "FavouriteQuest_questId_idx" ON "FavouriteQuest"("questId");

-- CreateIndex
CREATE UNIQUE INDEX "FavouriteQuest_familyId_questId_key" ON "FavouriteQuest"("familyId", "questId");

-- CreateIndex
CREATE INDEX "PlannedQuest_familyId_scheduledFor_idx" ON "PlannedQuest"("familyId", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "PlannedQuest_familyId_questId_scheduledFor_key" ON "PlannedQuest"("familyId", "questId", "scheduledFor");

-- CreateIndex
CREATE INDEX "PlannedQuestChild_childProfileId_idx" ON "PlannedQuestChild"("childProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_familyId_key" ON "Subscription"("familyId");

-- CreateIndex
CREATE INDEX "Subscription_plan_status_idx" ON "Subscription"("plan", "status");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_familyId_idx" ON "AuditLog"("familyId");

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_userId_idx" ON "AccountDeletionRequest"("userId");

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_scheduledPurgeAt_idx" ON "AccountDeletionRequest"("scheduledPurgeAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMembership" ADD CONSTRAINT "FamilyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMembership" ADD CONSTRAINT "FamilyMembership_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyPreference" ADD CONSTRAINT "FamilyPreference_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildProfile" ADD CONSTRAINT "ChildProfile_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildInterest" ADD CONSTRAINT "ChildInterest_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildInterest" ADD CONSTRAINT "ChildInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestTranslation" ADD CONSTRAINT "QuestTranslation_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestStep" ADD CONSTRAINT "QuestStep_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestStepTranslation" ADD CONSTRAINT "QuestStepTranslation_questStepId_fkey" FOREIGN KEY ("questStepId") REFERENCES "QuestStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestSkill" ADD CONSTRAINT "QuestSkill_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestSkill" ADD CONSTRAINT "QuestSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestMaterial" ADD CONSTRAINT "QuestMaterial_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestMaterial" ADD CONSTRAINT "QuestMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyInstruction" ADD CONSTRAINT "SafetyInstruction_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReflectionQuestion" ADD CONSTRAINT "ReflectionQuestion_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestVersion" ADD CONSTRAINT "QuestVersion_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestVersion" ADD CONSTRAINT "QuestVersion_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestCompletion" ADD CONSTRAINT "QuestCompletion_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestCompletion" ADD CONSTRAINT "QuestCompletion_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestCompletion" ADD CONSTRAINT "QuestCompletion_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestParticipation" ADD CONSTRAINT "QuestParticipation_questCompletionId_fkey" FOREIGN KEY ("questCompletionId") REFERENCES "QuestCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestParticipation" ADD CONSTRAINT "QuestParticipation_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionReflection" ADD CONSTRAINT "CompletionReflection_questCompletionId_fkey" FOREIGN KEY ("questCompletionId") REFERENCES "QuestCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionReflection" ADD CONSTRAINT "CompletionReflection_reflectionQuestionId_fkey" FOREIGN KEY ("reflectionQuestionId") REFERENCES "ReflectionQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionEvidence" ADD CONSTRAINT "CompletionEvidence_questCompletionId_fkey" FOREIGN KEY ("questCompletionId") REFERENCES "QuestCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionEvidence" ADD CONSTRAINT "CompletionEvidence_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardedBadge" ADD CONSTRAINT "AwardedBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardedBadge" ADD CONSTRAINT "AwardedBadge_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardedBadge" ADD CONSTRAINT "AwardedBadge_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardedBadge" ADD CONSTRAINT "AwardedBadge_questCompletionId_fkey" FOREIGN KEY ("questCompletionId") REFERENCES "QuestCompletion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteQuest" ADD CONSTRAINT "FavouriteQuest_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteQuest" ADD CONSTRAINT "FavouriteQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedQuest" ADD CONSTRAINT "PlannedQuest_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedQuest" ADD CONSTRAINT "PlannedQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedQuest" ADD CONSTRAINT "PlannedQuest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedQuestChild" ADD CONSTRAINT "PlannedQuestChild_plannedQuestId_fkey" FOREIGN KEY ("plannedQuestId") REFERENCES "PlannedQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedQuestChild" ADD CONSTRAINT "PlannedQuestChild_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
