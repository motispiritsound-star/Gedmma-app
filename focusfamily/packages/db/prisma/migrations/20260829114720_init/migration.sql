-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('guardian', 'child');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('member', 'support_admin');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('nl', 'en');

-- CreateEnum
CREATE TYPE "AgeBand" AS ENUM ('band_8_10', 'band_11_13', 'band_14_17', 'adult');

-- CreateEnum
CREATE TYPE "DataSourceKind" AS ENUM ('self_reported', 'app_observed', 'os_verified', 'simulated');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "AdapterKind" AS ENUM ('ios_screen_time', 'android_usage', 'mock', 'none');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('ios', 'android', 'web', 'unknown');

-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('account_basic', 'measurement_self_report', 'measurement_app_observed', 'measurement_os_verified', 'notifications_push', 'insights_weekly_review', 'ai_assistant');

-- CreateEnum
CREATE TYPE "ConsentDecision" AS ENUM ('granted', 'withdrawn', 'expired');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('draft', 'proposed', 'active', 'retired');

-- CreateEnum
CREATE TYPE "AgreementContext" AS ENUM ('meals', 'homework', 'bedtime', 'bedrooms', 'school', 'family_activities');

-- CreateEnum
CREATE TYPE "RuleAudience" AS ENUM ('everyone', 'adults', 'children', 'member');

-- CreateEnum
CREATE TYPE "RuleKind" AS ENUM ('devices_away', 'device_free_room', 'quiet_window', 'shared_activity', 'charge_outside_bedroom', 'ask_before_new_app');

-- CreateEnum
CREATE TYPE "FocusKind" AS ENUM ('dinner', 'homework', 'bedtime', 'family_time', 'custom');

-- CreateEnum
CREATE TYPE "FocusSessionStatus" AS ENUM ('running', 'paused', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "FocusEventType" AS ENUM ('start', 'pause', 'resume', 'complete', 'abandon');

-- CreateEnum
CREATE TYPE "PauseReason" AS ENUM ('someone_needed_me', 'urgent_call', 'schoolwork', 'changed_my_mind', 'other');

-- CreateEnum
CREATE TYPE "ConflictLevel" AS ENUM ('none', 'a_little', 'quite_a_bit');

-- CreateEnum
CREATE TYPE "GoalKind" AS ENUM ('device_free_dinners', 'screen_free_evenings', 'shared_activities', 'bedtime_routine', 'outdoor_time');

-- CreateEnum
CREATE TYPE "AchievementKind" AS ENUM ('first_agreement', 'first_focus_moment', 'goal_reached', 'week_reviewed', 'everyone_joined_in');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'family_premium', 'sponsored');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'none');

-- CreateEnum
CREATE TYPE "BillingProviderKind" AS ENUM ('mock', 'stripe_test', 'sponsor_code');

-- CreateEnum
CREATE TYPE "FeatureKey" AS ENUM ('agreements_multiple', 'insights_history_90d', 'programmes_guided', 'activities_extra_packs', 'review_export_pdf', 'focus_custom_schedules');

-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('plan', 'sponsor', 'grandfathered', 'trial');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('push', 'email', 'none');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'ready', 'failed', 'expired');

-- CreateEnum
CREATE TYPE "DeletionScope" AS ENUM ('self', 'child_profile', 'family');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('scheduled', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('outdoors', 'kitchen', 'making', 'games', 'talking', 'movement');

-- CreateEnum
CREATE TYPE "ArticleTopic" AS ENUM ('social_media', 'gaming', 'sleep', 'conversations', 'school', 'privacy');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "displayName" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'nl',
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'nl',
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
    "baselineStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL,
    "displayName" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "ageBand" "AgeBand" NOT NULL,
    "canEditOwnAgreements" BOOLEAN NOT NULL DEFAULT true,
    "linkedByUserId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "adapter" "AdapterKind" NOT NULL,
    "osVersion" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_sources" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT,
    "kind" "DataSourceKind" NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" TIMESTAMP(3),

    CONSTRAINT "measurement_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_summaries" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "source" "DataSourceKind" NOT NULL,
    "provider" TEXT NOT NULL,
    "confidence" "ConfidenceLevel" NOT NULL,
    "minutesByCategory" JSONB NOT NULL,
    "screenPickups" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "scope" "ConsentScope" NOT NULL,
    "decision" "ConsentDecision" NOT NULL,
    "statementKey" TEXT NOT NULL,
    "statementVersion" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_agreements" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'draft',
    "agreedByUserIds" TEXT[],
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "reviewOnDayKey" TEXT,

    CONSTRAINT "family_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_rules" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "context" "AgreementContext" NOT NULL,
    "kind" "RuleKind" NOT NULL,
    "audience" "RuleAudience" NOT NULL,
    "memberId" TEXT,
    "ageBands" "AgeBand"[],
    "startsAt" TEXT,
    "endsAt" TEXT,
    "weekdays" INTEGER[],
    "text" TEXT NOT NULL,
    "repairText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agreement_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_schedules" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "agreementId" TEXT,
    "kind" "FocusKind" NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "weekdays" INTEGER[],
    "participantIds" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_sessions" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "participantIds" TEXT[],
    "startedByUserId" TEXT NOT NULL,
    "plannedMinutes" INTEGER NOT NULL,
    "status" "FocusSessionStatus" NOT NULL DEFAULT 'running',
    "source" "DataSourceKind" NOT NULL DEFAULT 'app_observed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_session_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "FocusEventType" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "reason" "PauseReason",
    "recordedOffline" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "focus_session_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "sleepHours" DOUBLE PRECISION,
    "bedtime" TEXT,
    "mood" INTEGER NOT NULL,
    "conflict" "ConflictLevel" NOT NULL,
    "note" TEXT,
    "sharedWithFamily" BOOLEAN NOT NULL DEFAULT false,
    "source" "DataSourceKind" NOT NULL DEFAULT 'self_reported',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "kind" "GoalKind" NOT NULL,
    "title" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "periodDays" INTEGER NOT NULL DEFAULT 7,
    "startsOnDayKey" TEXT NOT NULL,
    "participantIds" TEXT[],
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_contributions" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "contributedByUserId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "focusSessionId" TEXT,
    "source" "DataSourceKind" NOT NULL DEFAULT 'self_reported',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "kind" "AchievementKind" NOT NULL,
    "goalId" TEXT,
    "titleKey" TEXT NOT NULL,
    "bodyKey" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibility" TEXT NOT NULL DEFAULT 'family_private',

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_suggestions" (
    "id" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "title" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "minutes" INTEGER NOT NULL,
    "minAge" INTEGER NOT NULL,
    "maxAge" INTEGER NOT NULL,
    "needsAdult" BOOLEAN NOT NULL DEFAULT true,
    "pack" TEXT NOT NULL DEFAULT 'core',
    "questlyRef" TEXT,

    CONSTRAINT "activity_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educational_articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "topic" "ArticleTopic" NOT NULL,
    "title" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "readMinutes" INTEGER NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'guardian',
    "sourceNote" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educational_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'free',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'none',
    "provider" "BillingProviderKind" NOT NULL DEFAULT 'mock',
    "providerRef" TEXT,
    "sponsorName" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlements" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "feature" "FeatureKey" NOT NULL,
    "source" "EntitlementSource" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "enabledCategories" TEXT[],
    "quietHoursStart" TEXT NOT NULL DEFAULT '21:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '07:30',
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT true,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'push',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_export_requests" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'json',
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "payload" JSONB,

    CONSTRAINT "data_export_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_requests" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "subjectUserId" TEXT,
    "scope" "DeletionScope" NOT NULL,
    "status" "DeletionStatus" NOT NULL DEFAULT 'scheduled',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executeAfter" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "familyId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "subjectUserId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_tokenHash_key" ON "auth_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "memberships_userId_idx" ON "memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_familyId_userId_key" ON "memberships"("familyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_tokenHash_key" ON "invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "invitations_familyId_idx" ON "invitations"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "child_profiles_membershipId_key" ON "child_profiles"("membershipId");

-- CreateIndex
CREATE INDEX "child_profiles_familyId_idx" ON "child_profiles"("familyId");

-- CreateIndex
CREATE INDEX "devices_familyId_idx" ON "devices"("familyId");

-- CreateIndex
CREATE INDEX "measurement_sources_familyId_userId_idx" ON "measurement_sources"("familyId", "userId");

-- CreateIndex
CREATE INDEX "usage_summaries_familyId_dayKey_idx" ON "usage_summaries"("familyId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "usage_summaries_userId_dayKey_source_provider_key" ON "usage_summaries"("userId", "dayKey", "source", "provider");

-- CreateIndex
CREATE INDEX "consent_records_familyId_subjectUserId_scope_idx" ON "consent_records"("familyId", "subjectUserId", "scope");

-- CreateIndex
CREATE INDEX "family_agreements_familyId_status_idx" ON "family_agreements"("familyId", "status");

-- CreateIndex
CREATE INDEX "agreement_rules_agreementId_idx" ON "agreement_rules"("agreementId");

-- CreateIndex
CREATE INDEX "focus_schedules_familyId_idx" ON "focus_schedules"("familyId");

-- CreateIndex
CREATE INDEX "focus_sessions_familyId_createdAt_idx" ON "focus_sessions"("familyId", "createdAt");

-- CreateIndex
CREATE INDEX "focus_session_events_sessionId_at_idx" ON "focus_session_events"("sessionId", "at");

-- CreateIndex
CREATE INDEX "check_ins_familyId_dayKey_idx" ON "check_ins"("familyId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_userId_dayKey_key" ON "check_ins"("userId", "dayKey");

-- CreateIndex
CREATE INDEX "goals_familyId_idx" ON "goals"("familyId");

-- CreateIndex
CREATE INDEX "goal_contributions_goalId_idx" ON "goal_contributions"("goalId");

-- CreateIndex
CREATE INDEX "achievements_familyId_idx" ON "achievements"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "educational_articles_slug_key" ON "educational_articles"("slug");

-- CreateIndex
CREATE INDEX "subscriptions_familyId_idx" ON "subscriptions"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "entitlements_familyId_feature_key" ON "entitlements"("familyId", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_familyId_key" ON "notification_preferences"("userId", "familyId");

-- CreateIndex
CREATE INDEX "data_export_requests_familyId_idx" ON "data_export_requests"("familyId");

-- CreateIndex
CREATE INDEX "deletion_requests_familyId_idx" ON "deletion_requests"("familyId");

-- CreateIndex
CREATE INDEX "audit_logs_familyId_at_idx" ON "audit_logs"("familyId", "at");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_sources" ADD CONSTRAINT "measurement_sources_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_summaries" ADD CONSTRAINT "usage_summaries_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_summaries" ADD CONSTRAINT "usage_summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_agreements" ADD CONSTRAINT "family_agreements_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_rules" ADD CONSTRAINT "agreement_rules_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "family_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_schedules" ADD CONSTRAINT "focus_schedules_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_schedules" ADD CONSTRAINT "focus_schedules_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "family_agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "focus_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_session_events" ADD CONSTRAINT "focus_session_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "focus_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_contributedByUserId_fkey" FOREIGN KEY ("contributedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_focusSessionId_fkey" FOREIGN KEY ("focusSessionId") REFERENCES "focus_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_requests" ADD CONSTRAINT "deletion_requests_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;
