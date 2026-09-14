/*
  Warnings:

  - The `enabledNotificationTypes` column on the `MerchantSettings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `allowedNotificationTypes` on the `WorkflowSetting` table. All the data in the column will be lost.
  - The `deliveryChannel` column on the `WorkflowSetting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `channel` on the `ActivityLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ActivityLog" DROP COLUMN "channel",
ADD COLUMN     "channel" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MerchantSettings" DROP COLUMN "enabledNotificationTypes",
ADD COLUMN     "enabledNotificationTypes" TEXT[] DEFAULT ARRAY['EMAIL', 'SLACK', 'IN_APP']::TEXT[];

-- AlterTable
ALTER TABLE "WorkflowSetting" DROP COLUMN "allowedNotificationTypes",
DROP COLUMN "deliveryChannel",
ADD COLUMN     "deliveryChannel" TEXT NOT NULL DEFAULT 'EMAIL';

-- DropEnum
DROP TYPE "NotificationType";
