-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'SLACK', 'IN_APP');

-- CreateTable
CREATE TABLE "MerchantSettings" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "notificationEmail" TEXT,
    "slackWebhookUrl" TEXT,
    "slackWorkspaceName" TEXT,
    "slackChannelName" TEXT,
    "enabledNotificationTypes" "NotificationType"[] DEFAULT ARRAY['EMAIL', 'SLACK', 'IN_APP']::"NotificationType"[],
    "alertOnTriggered" BOOLEAN NOT NULL DEFAULT true,
    "alertOnFailed" BOOLEAN NOT NULL DEFAULT true,
    "alertWeeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowSetting" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "recipeSlug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "flowWorkflowId" TEXT,
    "allowedNotificationTypes" "NotificationType"[] DEFAULT ARRAY['EMAIL', 'SLACK', 'IN_APP']::"NotificationType"[],
    "deliveryChannel" "NotificationType" NOT NULL DEFAULT 'EMAIL',
    "config" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "recipeSlug" TEXT NOT NULL,
    "recipeName" TEXT NOT NULL,
    "summaryText" TEXT NOT NULL,
    "channel" "NotificationType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "triggerIdea" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSettings_shop_key" ON "MerchantSettings"("shop");

-- CreateIndex
CREATE INDEX "MerchantSettings_shop_idx" ON "MerchantSettings"("shop");

-- CreateIndex
CREATE INDEX "WorkflowSetting_shop_idx" ON "WorkflowSetting"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowSetting_shop_recipeSlug_key" ON "WorkflowSetting"("shop", "recipeSlug");

-- CreateIndex
CREATE INDEX "ActivityLog_shop_createdAt_idx" ON "ActivityLog"("shop", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Suggestion_shop_idx" ON "Suggestion"("shop");

-- AddForeignKey
ALTER TABLE "WorkflowSetting" ADD CONSTRAINT "WorkflowSetting_shop_fkey" FOREIGN KEY ("shop") REFERENCES "MerchantSettings"("shop") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_shop_fkey" FOREIGN KEY ("shop") REFERENCES "MerchantSettings"("shop") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_shop_fkey" FOREIGN KEY ("shop") REFERENCES "MerchantSettings"("shop") ON DELETE CASCADE ON UPDATE CASCADE;
