-- CreateTable
CREATE TABLE "ObjectiveCompletion" (
    "id" SERIAL NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "objectiveId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObjectiveCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObjectiveCompletion_objectiveId_userId_key" ON "ObjectiveCompletion"("objectiveId", "userId");

-- AddForeignKey
ALTER TABLE "ObjectiveCompletion" ADD CONSTRAINT "ObjectiveCompletion_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectiveCompletion" ADD CONSTRAINT "ObjectiveCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
