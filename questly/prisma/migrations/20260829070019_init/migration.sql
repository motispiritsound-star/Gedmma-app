-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'CONTENT_ADMIN', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('OWNER', 'PARENT');

-- CreateEnum
CREATE TYPE "AgeBand" AS ENUM ('AGE_6_8', 'AGE_9_11', 'AGE_12_15');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'CHALLENGING');

-- CreateEnum
CREATE TYPE "Setting" AS ENUM ('INDOOR', 'OUTDOOR', 'BOTH');

-- CreateEnum
CREATE TYPE "EnvironmentType" AS ENUM ('CITY', 'SUBURB', 'RURAL');

-- CreateEnum
CREATE TYPE "WeatherSuitability" AS ENUM ('ANY', 'DRY', 'RAIN_FRIENDLY', 'SNOW', 'WARM');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SafetySeverity" AS ENUM ('INFO', 'CAUTION', 'ADULT_REQUIRED');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('IN_PROGRESS', 'ABANDONED', 'PENDING_APPROVAL', 'APPROVED');

-- CreateEnum
CREATE TYPE "PlannedQuestStatus" AS ENUM ('PLANNED', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "BadgeCriteria" AS ENUM ('COMPLETIONS_TOTAL', 'COMPLETIONS_IN_CATEGORY', 'SKILL_POINTS', 'DISTINCT_CATEGORIES', 'FAMILY_MILESTONE');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'FAMILY_PREMIUM', 'SCHOOL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('nl', 'en');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARENT',
    "locale" "Locale" NOT NULL DEFAULT 'nl',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'nl',
    "country" TEXT NOT NULL DEFAULT 'NL',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
    "environment" "EnvironmentType" NOT NULL DEFAULT 'SUBURB',
    "preferredDuration" INTEGER NOT NULL DEFAULT 45,
    "preferredDifficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "preferredSetting" "Setting" NOT NULL DEFAULT 'BOTH',
    "prefersFamilyActivity" BOOLEAN NOT NULL DEFAULT true,
    "adultCount" INTEGER NOT NULL DEFAULT 2,
    "requireParentApproval" BOOLEAN NOT NULL DEFAULT true,
    "onboardingCompletedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL DEFAULT 'PARENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarKey" TEXT NOT NULL DEFAULT 'fox',
    "ageBand" "AgeBand" NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionNl" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'compass',
    "colorToken" TEXT NOT NULL DEFAULT 'moss',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionNl" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "categoryId" TEXT,

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
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "isCommon" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "ageBands" "AgeBand"[],
    "durationMinutes" INTEGER NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "setting" "Setting" NOT NULL,
    "weather" "WeatherSuitability"[],
    "seasons" "Season"[],
    "minParticipants" INTEGER NOT NULL DEFAULT 1,
    "maxParticipants" INTEGER NOT NULL DEFAULT 6,
    "requiresAdult" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "status" "QuestStatus" NOT NULL DEFAULT 'DRAFT',
    "imageKey" TEXT NOT NULL DEFAULT 'quest-default',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
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
    "shortDescription" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "educationalObjective" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "preparation" TEXT[],
    "reflectionQuestions" TEXT[],

    CONSTRAINT "QuestTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestStep" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 5,
    "requiresAdult" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestStepTranslation" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "audioScript" TEXT,

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
    "textEn" TEXT NOT NULL,
    "textNl" TEXT NOT NULL,

    CONSTRAINT "SafetyInstruction_pkey" PRIMARY KEY ("id")
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
    "offlineMinutes" INTEGER NOT NULL DEFAULT 0,
    "familyNote" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'nl',
    "startedByUserId" TEXT,
    "approvedByUserId" TEXT,

    CONSTRAINT "QuestCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestParticipation" (
    "completionId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestParticipation_pkey" PRIMARY KEY ("completionId","childProfileId")
);

-- CreateTable
CREATE TABLE "CompletionReflection" (
    "id" TEXT NOT NULL,
    "completionId" TEXT NOT NULL,
    "childProfileId" TEXT,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletionReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletionEvidence" (
    "id" TEXT NOT NULL,
    "completionId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "caption" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletionEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameNl" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionNl" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'star',
    "criteria" "BadgeCriteria" NOT NULL,
    "threshold" INTEGER NOT NULL DEFAULT 1,
    "categoryId" TEXT,
    "skillId" TEXT,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardedBadge" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childProfileId" TEXT,
    "completionId" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AwardedBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavouriteQuest" (
    "familyId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavouriteQuest_pkey" PRIMARY KEY ("familyId","questId")
);

-- CreateTable
CREATE TABLE "PlannedQuest" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "scheduledFor" DATE NOT NULL,
    "timeOfDay" TEXT,
    "note" TEXT,
    "status" "PlannedQuestStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" TEXT NOT NULL DEFAULT 'mock',
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
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_type_idx" ON "VerificationToken"("userId", "type");

-- CreateIndex
CREATE INDEX "Family_deletedAt_idx" ON "Family"("deletedAt");

-- CreateIndex
CREATE INDEX "FamilyMembership_familyId_idx" ON "FamilyMembership"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMembership_userId_familyId_key" ON "FamilyMembership"("userId", "familyId");

-- CreateIndex
CREATE INDEX "ChildProfile_familyId_deletedAt_idx" ON "ChildProfile"("familyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_familyId_nickname_key" ON "ChildProfile"("familyId", "nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_slug_key" ON "Interest"("slug");

-- CreateIndex
CREATE INDEX "Interest_categoryId_idx" ON "Interest"("categoryId");

-- CreateIndex
CREATE INDEX "ChildInterest_interestId_idx" ON "ChildInterest"("interestId");

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
CREATE UNIQUE INDEX "QuestTranslation_questId_locale_key" ON "QuestTranslation"("questId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "QuestStep_questId_position_key" ON "QuestStep"("questId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QuestStepTranslation_stepId_locale_key" ON "QuestStepTranslation"("stepId", "locale");

-- CreateIndex
CREATE INDEX "QuestSkill_skillId_idx" ON "QuestSkill"("skillId");

-- CreateIndex
CREATE INDEX "QuestMaterial_materialId_idx" ON "QuestMaterial"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetyInstruction_questId_position_key" ON "SafetyInstruction"("questId", "position");

-- CreateIndex
CREATE INDEX "QuestVersion_questId_idx" ON "QuestVersion"("questId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestVersion_questId_version_key" ON "QuestVersion"("questId", "version");

-- CreateIndex
CREATE INDEX "QuestCompletion_familyId_status_idx" ON "QuestCompletion"("familyId", "status");

-- CreateIndex
CREATE INDEX "QuestCompletion_familyId_finishedAt_idx" ON "QuestCompletion"("familyId", "finishedAt");

-- CreateIndex
CREATE INDEX "QuestCompletion_questId_idx" ON "QuestCompletion"("questId");

-- CreateIndex
CREATE INDEX "QuestParticipation_childProfileId_idx" ON "QuestParticipation"("childProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletionReflection_completionId_position_key" ON "CompletionReflection"("completionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CompletionEvidence_storageKey_key" ON "CompletionEvidence"("storageKey");

-- CreateIndex
CREATE INDEX "CompletionEvidence_completionId_idx" ON "CompletionEvidence"("completionId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_slug_key" ON "Badge"("slug");

-- CreateIndex
CREATE INDEX "AwardedBadge_familyId_idx" ON "AwardedBadge"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "AwardedBadge_badgeId_familyId_childProfileId_key" ON "AwardedBadge"("badgeId", "familyId", "childProfileId");

-- CreateIndex
CREATE INDEX "FavouriteQuest_questId_idx" ON "FavouriteQuest"("questId");

-- CreateIndex
CREATE INDEX "PlannedQuest_familyId_scheduledFor_idx" ON "PlannedQuest"("familyId", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "PlannedQuest_familyId_questId_scheduledFor_key" ON "PlannedQuest"("familyId", "questId", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_familyId_key" ON "Subscription"("familyId");

-- CreateIndex
CREATE INDEX "Subscription_plan_status_idx" ON "Subscription"("plan", "status");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMembership" ADD CONSTRAINT "FamilyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMembership" ADD CONSTRAINT "FamilyMembership_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "QuestTranslation" ADD CONSTRAINT "QuestTranslation_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestStep" ADD CONSTRAINT "QuestStep_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestStepTranslation" ADD CONSTRAINT "QuestStepTranslation_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "QuestStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "QuestVersion" ADD CONSTRAINT "QuestVersion_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestVersion" ADD CONSTRAINT "QuestVersion_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestCompletion" ADD CONSTRAINT "QuestCompletion_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestCompletion" ADD CONSTRAINT "QuestCompletion_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestCompletion" ADD CONSTRAINT "QuestCompletion_startedByUserId_fkey" FOREIGN KEY ("startedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestCompletion" ADD CONSTRAINT "QuestCompletion_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestParticipation" ADD CONSTRAINT "QuestParticipation_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "QuestCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestParticipation" ADD CONSTRAINT "QuestParticipation_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionReflection" ADD CONSTRAINT "CompletionReflection_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "QuestCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionReflection" ADD CONSTRAINT "CompletionReflection_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletionEvidence" ADD CONSTRAINT "CompletionEvidence_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "QuestCompletion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "AwardedBadge" ADD CONSTRAINT "AwardedBadge_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "QuestCompletion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteQuest" ADD CONSTRAINT "FavouriteQuest_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavouriteQuest" ADD CONSTRAINT "FavouriteQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedQuest" ADD CONSTRAINT "PlannedQuest_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedQuest" ADD CONSTRAINT "PlannedQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
