-- AlterTable
ALTER TABLE "CallerLookup" ADD COLUMN     "blockedCalls" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enableIVR" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "forwardToNumber" TEXT,
ADD COLUMN     "ivrBehavior" TEXT,
ADD COLUMN     "ivrMessage" TEXT,
ADD COLUMN     "newMessages" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationSound" TEXT,
ADD COLUMN     "weeklyReports" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "transcription" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActive" TIMESTAMP(3);
