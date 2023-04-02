-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('IDLE', 'ACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "publicKey" TEXT NOT NULL,
    "streamKey" TEXT NOT NULL,
    "playbackId" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "streamStatus" "StreamStatus" NOT NULL DEFAULT 'IDLE',

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
CREATE UNIQUE INDEX "User_streamKey_key" ON "User"("streamKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_playbackId_key" ON "User"("playbackId");

-- CreateIndex
CREATE UNIQUE INDEX "User_streamId_key" ON "User"("streamId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuth_challengeHash_key" ON "UserAuth"("challengeHash");
