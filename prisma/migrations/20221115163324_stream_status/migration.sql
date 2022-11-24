-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('IDLE', 'ACTIVE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "streamStatus" "StreamStatus" NOT NULL DEFAULT 'IDLE';
