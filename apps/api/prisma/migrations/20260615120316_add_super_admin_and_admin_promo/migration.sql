-- CreateEnum
CREATE TYPE "AdminPromoRole" AS ENUM ('OWNER', 'COLLABORATOR');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- CreateTable
CREATE TABLE "AdminPromo" (
    "adminId" INTEGER NOT NULL,
    "promoId" INTEGER NOT NULL,
    "role" "AdminPromoRole" NOT NULL DEFAULT 'OWNER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPromo_pkey" PRIMARY KEY ("adminId","promoId")
);

-- AddForeignKey
ALTER TABLE "AdminPromo" ADD CONSTRAINT "AdminPromo_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPromo" ADD CONSTRAINT "AdminPromo_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
