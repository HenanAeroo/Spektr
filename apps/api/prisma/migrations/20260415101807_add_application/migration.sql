-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('RAPPEL', 'SANS_REPONSE', 'ENTRETIEN', 'DECROCHEE');

-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('A_CONTACTER', 'ENVOYE', 'RELANCE', 'EN_DISCUSSION', 'REPONSE_POSITIVE', 'REFUS');

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "entreprise" TEXT NOT NULL,
    "lien" TEXT,
    "commentaire" TEXT,
    "statut" "Statut" NOT NULL,
    "contact_nom" TEXT,
    "contact_email" TEXT,
    "contact_tel" TEXT,
    "date_candidature" TIMESTAMP(3) NOT NULL,
    "date_relance" TIMESTAMP(3),
    "outcome" "Outcome",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
