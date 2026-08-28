-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_INACTIVE';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "billingSnapshot" JSONB;
