/*
  Warnings:

  - You are about to drop the column `notes` on the `Suggestion` table. All the data in the column will be lost.
  - You are about to drop the column `triggerIdea` on the `Suggestion` table. All the data in the column will be lost.
  - Added the required column `name` to the `Suggestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `problem` to the `Suggestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trigger` to the `Suggestion` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Suggestion_shop_idx";

-- AlterTable
ALTER TABLE "Suggestion" DROP COLUMN "notes",
DROP COLUMN "triggerIdea",
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "problem" TEXT NOT NULL,
ADD COLUMN     "trigger" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Suggestion_shop_createdAt_idx" ON "Suggestion"("shop", "createdAt" DESC);
