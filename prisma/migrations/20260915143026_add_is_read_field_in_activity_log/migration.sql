-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "details" JSONB DEFAULT '{}',
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "channel" SET DEFAULT 'IN_APP';

-- CreateIndex
CREATE INDEX "ActivityLog_shop_isRead_idx" ON "ActivityLog"("shop", "isRead");
