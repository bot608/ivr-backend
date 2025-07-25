/*
  Warnings:

  - The primary key for the `CallerLookup` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "CallerLookup" DROP CONSTRAINT "CallerLookup_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "CallerLookup_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "CallerLookup_id_seq";
