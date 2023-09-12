-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('IDLE', 'ACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "publicKey" TEXT NOT NULL,
    "streamStatus" "StreamStatus" NOT NULL DEFAULT 'IDLE',
    "streamTitle" TEXT,
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "viewerCountUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatChannelId" TEXT,
    "defaultZapAmount" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAuth" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "challengeHash" TEXT NOT NULL,

    CONSTRAINT "UserAuth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_publicKey_key" ON "User"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_chatChannelId_key" ON "User"("chatChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuth_challengeHash_key" ON "UserAuth"("challengeHash");
