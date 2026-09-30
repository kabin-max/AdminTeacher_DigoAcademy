-- Allow guest (unauthenticated) inquiries: studentId becomes optional and guest
-- contact fields are captured. A student account is created/linked on conversion.

-- AlterTable
ALTER TABLE "Inquiry" ALTER COLUMN "studentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN "guestName" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "guestEmail" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "guestPhone" TEXT;

-- CreateIndex
CREATE INDEX "Inquiry_guestEmail_idx" ON "Inquiry"("guestEmail");
