/*
  Warnings:

  - You are about to drop the column `livestreamId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[streamId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `streamId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_livestreamId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "livestreamId",
ADD COLUMN     "streamId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_streamId_key" ON "User"("streamId");
