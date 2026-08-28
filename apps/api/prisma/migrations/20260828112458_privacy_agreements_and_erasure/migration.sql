-- CreateEnum
CREATE TYPE "AgreementDocument" AS ENUM ('TERMS', 'PRIVACY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ageConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "anonymisedAt" TIMESTAMP(3),
ADD COLUMN     "marketingOptInAt" TIMESTAMP(3),
ADD COLUMN     "privacyVersion" TEXT,
ADD COLUMN     "termsVersion" TEXT;

-- CreateTable
CREATE TABLE "agreement_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "document" "AgreementDocument" NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "agreement_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agreement_records_userId_acceptedAt_idx" ON "agreement_records"("userId", "acceptedAt");

-- CreateIndex
CREATE INDEX "users_lastSeenAt_idx" ON "users"("lastSeenAt");

-- CreateIndex
CREATE INDEX "users_anonymisedAt_idx" ON "users"("anonymisedAt");

-- AddForeignKey
ALTER TABLE "agreement_records" ADD CONSTRAINT "agreement_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
