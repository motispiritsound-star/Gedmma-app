-- CreateEnum
CREATE TYPE "public"."Locale" AS ENUM ('NL', 'EN');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('GUARDIAN', 'PROVIDER_STAFF', 'ADMIN', 'SAFEGUARDING_OFFICER');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."AgeBand" AS ENUM ('AGE_6_8', 'AGE_9_11', 'AGE_12_14', 'AGE_15_17');

-- CreateEnum
CREATE TYPE "public"."FamilyRole" AS ENUM ('OWNER', 'CO_GUARDIAN');

-- CreateEnum
CREATE TYPE "public"."ProviderStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."VerificationDocumentType" AS ENUM ('CHAMBER_OF_COMMERCE', 'LIABILITY_INSURANCE', 'VOG_DECLARATION', 'SAFEGUARDING_POLICY', 'IDENTITY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VerificationDecision" AS ENUM ('PENDING', 'MORE_INFO_REQUIRED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ProviderStaffRole" AS ENUM ('OWNER', 'MANAGER', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "public"."ActivityCategory" AS ENUM ('SPORTS', 'MUSIC', 'COOKING', 'ART', 'CRAFTS', 'TECHNOLOGY', 'NATURE', 'THEATRE', 'PRACTICAL_SKILLS', 'DANCE', 'LANGUAGES', 'SCIENCE');

-- CreateEnum
CREATE TYPE "public"."ActivityStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ActivityLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED_BY_GUARDIAN', 'CANCELLED_BY_PROVIDER', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."WaitlistStatus" AS ENUM ('WAITING', 'PROMOTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('EXPECTED', 'ATTENDED', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "public"."PlanTier" AS ENUM ('FREE_DISCOVERY', 'FAMILY_MONTHLY', 'PROVIDER_PRO');

-- CreateEnum
CREATE TYPE "public"."PlanAudience" AS ENUM ('GUARDIAN', 'PROVIDER');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CreditEntryType" AS ENUM ('MONTHLY_GRANT', 'SIGNUP_BONUS', 'BOOKING_DEDUCTION', 'CANCELLATION_REFUND', 'ADMIN_ADJUSTMENT', 'EXPIRY');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentPurpose" AS ENUM ('SUBSCRIPTION', 'ONE_OFF', 'CANCELLATION_FEE');

-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "public"."IncidentCategory" AS ENUM ('INJURY', 'BEHAVIOUR', 'SAFEGUARDING', 'FACILITY', 'DISCRIMINATION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."IncidentStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."SafeguardingCaseStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'REFERRED_TO_AUTHORITY', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."NotificationCategory" AS ENUM ('ACCOUNT', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'WAITLIST_PROMOTED', 'SESSION_REMINDER', 'CREDITS_GRANTED', 'PROVIDER_VERIFICATION', 'PROVIDER_ANNOUNCEMENT', 'INCIDENT', 'SAFEGUARDING');

-- CreateEnum
CREATE TYPE "public"."ConsentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'CHILD_DATA_PROCESSING', 'MEDICAL_SHARING', 'MARKETING_EMAIL');

-- CreateEnum
CREATE TYPE "public"."MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNormalised" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'GUARDIAN',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "locale" "public"."Locale" NOT NULL DEFAULT 'NL',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "anonymisedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuthSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" TEXT,
    "locale" "public"."Locale" NOT NULL DEFAULT 'NL',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FamilyMembership" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."FamilyRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChildProfile" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "ageBand" "public"."AgeBand" NOT NULL,
    "pronouns" TEXT,
    "accessibilityNeeds" TEXT,
    "medicalNotes" TEXT,
    "preferredLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Interest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labelNl" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "category" "public"."ActivityCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "version" TEXT NOT NULL,
    "ipHash" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."City" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
    "defaultLocale" "public"."Locale" NOT NULL DEFAULT 'NL',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isLaunchCity" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Venue" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "approxLatitude" DOUBLE PRECISION NOT NULL,
    "approxLongitude" DOUBLE PRECISION NOT NULL,
    "accessibilityNotes" TEXT,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Provider" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "chamberOfCommerceNo" TEXT,
    "vatNumber" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactPersonName" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "status" "public"."ProviderStatus" NOT NULL DEFAULT 'DRAFT',
    "liabilityInsurer" TEXT,
    "liabilityPolicyNo" TEXT,
    "insuranceExpiresAt" TIMESTAMP(3),
    "safeguardingPolicyUrl" TEXT,
    "vogDeclared" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "payoutAccountRef" TEXT,
    "commissionBps" INTEGER NOT NULL DEFAULT 1500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderVerification" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "documentType" "public"."VerificationDocumentType" NOT NULL,
    "mediaAssetId" TEXT,
    "reference" TEXT,
    "decision" "public"."VerificationDecision" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewerNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderStaff" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."ProviderStaffRole" NOT NULL DEFAULT 'INSTRUCTOR',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vogVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "instructorId" TEXT,
    "slug" TEXT NOT NULL,
    "category" "public"."ActivityCategory" NOT NULL,
    "level" "public"."ActivityLevel" NOT NULL DEFAULT 'ALL_LEVELS',
    "status" "public"."ActivityStatus" NOT NULL DEFAULT 'DRAFT',
    "minAgeBand" "public"."AgeBand" NOT NULL,
    "maxAgeBand" "public"."AgeBand" NOT NULL,
    "creditCost" INTEGER NOT NULL,
    "listPriceCents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "languages" "public"."Locale"[] DEFAULT ARRAY['NL']::"public"."Locale"[],
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "sensoryFriendly" BOOLEAN NOT NULL DEFAULT false,
    "trialAvailable" BOOLEAN NOT NULL DEFAULT false,
    "equipmentProvided" BOOLEAN NOT NULL DEFAULT true,
    "cancellationHours" INTEGER NOT NULL DEFAULT 24,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityTranslation" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "locale" "public"."Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "whatToBring" TEXT,
    "safetyNotes" TEXT,
    "cancellationTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Capacity" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "seatsTaken" INTEGER NOT NULL DEFAULT 0,
    "waitlistLimit" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "creditsCharged" INTEGER NOT NULL,
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "lateCancellation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WaitlistEntry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "public"."WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "promotedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'EXPECTED',
    "checkedInAt" TIMESTAMP(3),
    "recordedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" "public"."PlanTier" NOT NULL,
    "audience" "public"."PlanAudience" NOT NULL DEFAULT 'GUARDIAN',
    "nameNl" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionNl" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "monthlyCredits" INTEGER NOT NULL DEFAULT 0,
    "rolloverLimit" INTEGER NOT NULL DEFAULT 0,
    "commissionBps" INTEGER NOT NULL DEFAULT 1500,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "familyId" TEXT,
    "providerId" TEXT,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditLedgerEntry" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "bookingId" TEXT,
    "type" "public"."CreditEntryType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "familyId" TEXT,
    "subscriptionId" TEXT,
    "purpose" "public"."PaymentPurpose" NOT NULL DEFAULT 'SUBSCRIPTION',
    "amountCents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "externalRef" TEXT NOT NULL,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "reason" TEXT NOT NULL,
    "status" "public"."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "externalRef" TEXT,
    "requestedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payout" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossCents" INTEGER NOT NULL,
    "commissionCents" INTEGER NOT NULL,
    "netCents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "externalRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" "public"."ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "moderationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Favourite" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "childProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favourite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "category" "public"."NotificationCategory" NOT NULL,
    "titleNl" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyNl" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderMessage" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Incident" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "providerId" TEXT,
    "sessionId" TEXT,
    "reporterId" TEXT,
    "category" "public"."IncidentCategory" NOT NULL,
    "severity" "public"."IncidentSeverity" NOT NULL DEFAULT 'LOW',
    "status" "public"."IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "summary" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "resolution" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SafeguardingCase" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "officerId" TEXT,
    "status" "public"."SafeguardingCaseStatus" NOT NULL DEFAULT 'OPEN',
    "caseNotes" TEXT,
    "authorityReference" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafeguardingCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" "public"."UserRole",
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MediaAsset" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "activityId" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "visibility" "public"."MediaVisibility" NOT NULL DEFAULT 'PRIVATE',
    "originalName" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ChildInterests" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ChildInterests_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_ActivityInterests" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ActivityInterests_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailNormalised_key" ON "public"."User"("emailNormalised");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "public"."User"("role", "status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "public"."AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "public"."AuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailToken_tokenHash_key" ON "public"."EmailToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailToken_userId_purpose_idx" ON "public"."EmailToken"("userId", "purpose");

-- CreateIndex
CREATE INDEX "Family_cityId_idx" ON "public"."Family"("cityId");

-- CreateIndex
CREATE INDEX "FamilyMembership_userId_idx" ON "public"."FamilyMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMembership_familyId_userId_key" ON "public"."FamilyMembership"("familyId", "userId");

-- CreateIndex
CREATE INDEX "ChildProfile_familyId_archivedAt_idx" ON "public"."ChildProfile"("familyId", "archivedAt");

-- CreateIndex
CREATE INDEX "ChildProfile_ageBand_idx" ON "public"."ChildProfile"("ageBand");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_slug_key" ON "public"."Interest"("slug");

-- CreateIndex
CREATE INDEX "Interest_category_idx" ON "public"."Interest"("category");

-- CreateIndex
CREATE INDEX "Consent_userId_type_idx" ON "public"."Consent"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "public"."City"("slug");

-- CreateIndex
CREATE INDEX "Venue_cityId_idx" ON "public"."Venue"("cityId");

-- CreateIndex
CREATE INDEX "Venue_providerId_idx" ON "public"."Venue"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "public"."Provider"("slug");

-- CreateIndex
CREATE INDEX "Provider_status_idx" ON "public"."Provider"("status");

-- CreateIndex
CREATE INDEX "ProviderVerification_providerId_decision_idx" ON "public"."ProviderVerification"("providerId", "decision");

-- CreateIndex
CREATE INDEX "ProviderVerification_decision_submittedAt_idx" ON "public"."ProviderVerification"("decision", "submittedAt");

-- CreateIndex
CREATE INDEX "ProviderStaff_userId_idx" ON "public"."ProviderStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderStaff_providerId_userId_key" ON "public"."ProviderStaff"("providerId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "public"."Activity"("slug");

-- CreateIndex
CREATE INDEX "Activity_status_category_idx" ON "public"."Activity"("status", "category");

-- CreateIndex
CREATE INDEX "Activity_providerId_status_idx" ON "public"."Activity"("providerId", "status");

-- CreateIndex
CREATE INDEX "Activity_minAgeBand_maxAgeBand_idx" ON "public"."Activity"("minAgeBand", "maxAgeBand");

-- CreateIndex
CREATE INDEX "ActivityTranslation_locale_idx" ON "public"."ActivityTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityTranslation_activityId_locale_key" ON "public"."ActivityTranslation"("activityId", "locale");

-- CreateIndex
CREATE INDEX "Session_activityId_startsAt_idx" ON "public"."Session"("activityId", "startsAt");

-- CreateIndex
CREATE INDEX "Session_startsAt_status_idx" ON "public"."Session"("startsAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Capacity_sessionId_key" ON "public"."Capacity"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "public"."Booking"("reference");

-- CreateIndex
CREATE INDEX "Booking_familyId_status_idx" ON "public"."Booking"("familyId", "status");

-- CreateIndex
CREATE INDEX "Booking_sessionId_status_idx" ON "public"."Booking"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_sessionId_childProfileId_key" ON "public"."Booking"("sessionId", "childProfileId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_sessionId_status_position_idx" ON "public"."WaitlistEntry"("sessionId", "status", "position");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_sessionId_childProfileId_key" ON "public"."WaitlistEntry"("sessionId", "childProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_bookingId_key" ON "public"."Attendance"("bookingId");

-- CreateIndex
CREATE INDEX "Attendance_sessionId_status_idx" ON "public"."Attendance"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "public"."SubscriptionPlan"("slug");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_audience_isActive_idx" ON "public"."SubscriptionPlan"("audience", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_externalRef_key" ON "public"."Subscription"("externalRef");

-- CreateIndex
CREATE INDEX "Subscription_familyId_status_idx" ON "public"."Subscription"("familyId", "status");

-- CreateIndex
CREATE INDEX "Subscription_providerId_status_idx" ON "public"."Subscription"("providerId", "status");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_familyId_createdAt_idx" ON "public"."CreditLedgerEntry"("familyId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditLedgerEntry_bookingId_idx" ON "public"."CreditLedgerEntry"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditLedgerEntry_familyId_idempotencyKey_key" ON "public"."CreditLedgerEntry"("familyId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalRef_key" ON "public"."Payment"("externalRef");

-- CreateIndex
CREATE INDEX "Payment_familyId_status_idx" ON "public"."Payment"("familyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_externalRef_key" ON "public"."Refund"("externalRef");

-- CreateIndex
CREATE INDEX "Refund_paymentId_status_idx" ON "public"."Refund"("paymentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_externalRef_key" ON "public"."Payout"("externalRef");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "public"."Payout"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_providerId_periodStart_periodEnd_key" ON "public"."Payout"("providerId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_receivedAt_idx" ON "public"."WebhookEvent"("eventType", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "public"."WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "public"."Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_activityId_status_idx" ON "public"."Review"("activityId", "status");

-- CreateIndex
CREATE INDEX "Review_familyId_idx" ON "public"."Review"("familyId");

-- CreateIndex
CREATE INDEX "Favourite_activityId_idx" ON "public"."Favourite"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "Favourite_familyId_activityId_childProfileId_key" ON "public"."Favourite"("familyId", "activityId", "childProfileId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "public"."Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_category_createdAt_idx" ON "public"."Notification"("category", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderMessage_providerId_sentAt_idx" ON "public"."ProviderMessage"("providerId", "sentAt");

-- CreateIndex
CREATE INDEX "ProviderMessage_recipientId_idx" ON "public"."ProviderMessage"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_reference_key" ON "public"."Incident"("reference");

-- CreateIndex
CREATE INDEX "Incident_status_severity_idx" ON "public"."Incident"("status", "severity");

-- CreateIndex
CREATE INDEX "Incident_providerId_status_idx" ON "public"."Incident"("providerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SafeguardingCase_reference_key" ON "public"."SafeguardingCase"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "SafeguardingCase_incidentId_key" ON "public"."SafeguardingCase"("incidentId");

-- CreateIndex
CREATE INDEX "SafeguardingCase_status_idx" ON "public"."SafeguardingCase"("status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "public"."AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "public"."AuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "public"."MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_providerId_visibility_idx" ON "public"."MediaAsset"("providerId", "visibility");

-- CreateIndex
CREATE INDEX "_ChildInterests_B_index" ON "public"."_ChildInterests"("B");

-- CreateIndex
CREATE INDEX "_ActivityInterests_B_index" ON "public"."_ActivityInterests"("B");

-- AddForeignKey
ALTER TABLE "public"."AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Family" ADD CONSTRAINT "Family_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FamilyMembership" ADD CONSTRAINT "FamilyMembership_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FamilyMembership" ADD CONSTRAINT "FamilyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChildProfile" ADD CONSTRAINT "ChildProfile_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Venue" ADD CONSTRAINT "Venue_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Venue" ADD CONSTRAINT "Venue_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderVerification" ADD CONSTRAINT "ProviderVerification_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderVerification" ADD CONSTRAINT "ProviderVerification_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "public"."MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderVerification" ADD CONSTRAINT "ProviderVerification_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderStaff" ADD CONSTRAINT "ProviderStaff_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderStaff" ADD CONSTRAINT "ProviderStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "public"."ProviderStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityTranslation" ADD CONSTRAINT "ActivityTranslation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Capacity" ADD CONSTRAINT "Capacity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "public"."ChildProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "public"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "public"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "public"."ProviderStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."Family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditLedgerEntry" ADD CONSTRAINT "CreditLedgerEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favourite" ADD CONSTRAINT "Favourite_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favourite" ADD CONSTRAINT "Favourite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favourite" ADD CONSTRAINT "Favourite_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Favourite" ADD CONSTRAINT "Favourite_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "public"."ChildProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderMessage" ADD CONSTRAINT "ProviderMessage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderMessage" ADD CONSTRAINT "ProviderMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderMessage" ADD CONSTRAINT "ProviderMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Incident" ADD CONSTRAINT "Incident_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Incident" ADD CONSTRAINT "Incident_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Incident" ADD CONSTRAINT "Incident_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SafeguardingCase" ADD CONSTRAINT "SafeguardingCase_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SafeguardingCase" ADD CONSTRAINT "SafeguardingCase_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "public"."Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ChildInterests" ADD CONSTRAINT "_ChildInterests_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ChildInterests" ADD CONSTRAINT "_ChildInterests_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ActivityInterests" ADD CONSTRAINT "_ActivityInterests_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ActivityInterests" ADD CONSTRAINT "_ActivityInterests_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
