-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('PENDING', 'PROVISIONING', 'PROVISIONING_FAILED', 'READY', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'SETTLED', 'CANCELED', 'ACCEPTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "publicKey" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "hlsUrl" TEXT,
    "rtmpUrl" TEXT,
    "streamKey" TEXT NOT NULL,
    "lightningAddress" TEXT,
    "duration" INTEGER NOT NULL,
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "viewerCountUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StreamStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamVariant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "streamId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "framerate" INTEGER NOT NULL,

    CONSTRAINT "StreamVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelInvoice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "maxAgeSeconds" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "hash" TEXT NOT NULL,
    "bolt11" TEXT NOT NULL,
    "mSatsTarget" INTEGER NOT NULL,
    "streamId" TEXT NOT NULL,

    CONSTRAINT "ChannelInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamInvoice" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "maxAgeSeconds" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "hash" TEXT NOT NULL,
    "preimage" TEXT,
    "bolt11" TEXT NOT NULL,
    "mSatsTarget" INTEGER NOT NULL,
    "streamId" TEXT NOT NULL,
    "streamVariantId" TEXT NOT NULL,

    CONSTRAINT "StreamInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_publicKey_key" ON "User"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuth_challengeHash_key" ON "UserAuth"("challengeHash");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelInvoice_hash_key" ON "ChannelInvoice"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "StreamInvoice_hash_key" ON "StreamInvoice"("hash");

-- AddForeignKey
ALTER TABLE "Stream" ADD CONSTRAINT "Stream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamVariant" ADD CONSTRAINT "StreamVariant_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelInvoice" ADD CONSTRAINT "ChannelInvoice_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamInvoice" ADD CONSTRAINT "StreamInvoice_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamInvoice" ADD CONSTRAINT "StreamInvoice_streamVariantId_fkey" FOREIGN KEY ("streamVariantId") REFERENCES "StreamVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
