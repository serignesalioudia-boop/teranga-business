-- CreateEnum
CREATE TYPE "ShareTargetType" AS ENUM ('PRODUCT', 'STORE', 'CATEGORY');

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "targetType" "ShareTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL DEFAULT 'copy',
    "url" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareEvent" (
    "id" TEXT NOT NULL,
    "shareLinkId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_targetType_targetId_channelId_key" ON "ShareLink"("targetType", "targetId", "channelId");

-- CreateIndex
CREATE INDEX "ShareLink_targetType_targetId_idx" ON "ShareLink"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ShareLink_channelId_idx" ON "ShareLink"("channelId");

-- CreateIndex
CREATE INDEX "ShareLink_createdAt_idx" ON "ShareLink"("createdAt");

-- CreateIndex
CREATE INDEX "ShareEvent_shareLinkId_idx" ON "ShareEvent"("shareLinkId");

-- CreateIndex
CREATE INDEX "ShareEvent_userId_idx" ON "ShareEvent"("userId");

-- CreateIndex
CREATE INDEX "ShareEvent_createdAt_idx" ON "ShareEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "ShareEvent" ADD CONSTRAINT "ShareEvent_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "ShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
