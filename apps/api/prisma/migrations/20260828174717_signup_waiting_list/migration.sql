-- CreateEnum
CREATE TYPE "SignupRole" AS ENUM ('CUSTOMER', 'PRO');

-- CreateTable
CREATE TABLE "signups" (
    "id" TEXT NOT NULL,
    "role" "SignupRole" NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "cityId" TEXT,
    "categorySlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kvk" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'nl',
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,
    "invitedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signups_role_createdAt_idx" ON "signups"("role", "createdAt");

-- CreateIndex
CREATE INDEX "signups_cityId_idx" ON "signups"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "signups_email_role_key" ON "signups"("email", "role");

-- AddForeignKey
ALTER TABLE "signups" ADD CONSTRAINT "signups_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
