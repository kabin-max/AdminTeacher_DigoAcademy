-- AlterTable
ALTER TABLE "Batch" ADD COLUMN     "googleEventId" TEXT,
ADD COLUMN     "meetLink" TEXT;

-- CreateTable
CREATE TABLE "BatchVideo" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BatchVideo_batchId_idx" ON "BatchVideo"("batchId");

-- AddForeignKey
ALTER TABLE "BatchVideo" ADD CONSTRAINT "BatchVideo_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
