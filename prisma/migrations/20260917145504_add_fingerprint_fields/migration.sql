-- AlterTable
ALTER TABLE "WorkflowSetting" ADD COLUMN     "lastAlertedAt" TIMESTAMP(3),
ADD COLUMN     "lastFingerprint" TEXT,
ADD COLUMN     "lastRunAt" TIMESTAMP(3);
