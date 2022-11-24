/*
  Warnings:

  - A unique constraint covering the columns `[streamKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[playbackId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[livestreamId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `livestreamId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `playbackId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `streamKey` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "livestreamId" TEXT NOT NULL,
ADD COLUMN     "playbackId" TEXT NOT NULL,
ADD COLUMN     "streamKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_streamKey_key" ON "User"("streamKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_playbackId_key" ON "User"("playbackId");

-- CreateIndex
CREATE UNIQUE INDEX "User_livestreamId_key" ON "User"("livestreamId");
