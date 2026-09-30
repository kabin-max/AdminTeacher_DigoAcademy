-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('SINGLE', 'MULTIPLE');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN "kind" "QuestionKind" NOT NULL DEFAULT 'SINGLE';
