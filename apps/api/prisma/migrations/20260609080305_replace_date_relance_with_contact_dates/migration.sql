/*
  Warnings:

  - You are about to drop the column `date_relance` on the `Application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Application" DROP COLUMN "date_relance",
ADD COLUMN     "date_relance_contact" TIMESTAMP(3),
ADD COLUMN     "date_relance_tel" TIMESTAMP(3),
ADD COLUMN     "date_reponse_entreprise" TIMESTAMP(3);
