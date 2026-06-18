-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VALIDATED', 'TO_CORRECT');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CV', 'LM', 'OTHER');

-- AlterEnum
ALTER TYPE "NotifType" ADD VALUE 'DOCUMENT_REVIEW';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "docType" "DocumentType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING';
