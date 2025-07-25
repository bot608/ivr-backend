/*
  Warnings:

  - You are about to drop the column `createdAt` on the `CallerLookup` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `CallerLookup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CallerLookup" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "callTime" TIMESTAMP(3),
ADD COLUMN     "user_Id" TEXT,
ALTER COLUMN "answered" DROP NOT NULL;
