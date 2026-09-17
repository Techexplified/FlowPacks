/*
  Warnings:

  - You are about to drop the column `alertOnFailed` on the `MerchantSettings` table. All the data in the column will be lost.
  - You are about to drop the column `alertOnTriggered` on the `MerchantSettings` table. All the data in the column will be lost.
  - You are about to drop the column `alertWeeklyDigest` on the `MerchantSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MerchantSettings" DROP COLUMN "alertOnFailed",
DROP COLUMN "alertOnTriggered",
DROP COLUMN "alertWeeklyDigest";
