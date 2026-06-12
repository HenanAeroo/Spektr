/*
  Warnings:

  - You are about to drop the column `last_aseen_at` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "last_aseen_at",
ADD COLUMN     "last_seen_at" TIMESTAMP(3);
