-- AlterTable
ALTER TABLE "Stream" ADD COLUMN     "description" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "participants" TEXT[],
ADD COLUMN     "relays" TEXT[],
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "t" TEXT[],
ADD COLUMN     "title" TEXT;
