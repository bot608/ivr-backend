-- CreateTable
CREATE TABLE "CallerLookup" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "callerName" TEXT NOT NULL,
    "callerType" TEXT NOT NULL,
    "lineType" TEXT NOT NULL,
    "lineCategory" TEXT NOT NULL,
    "answered" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallerLookup_pkey" PRIMARY KEY ("id")
);
