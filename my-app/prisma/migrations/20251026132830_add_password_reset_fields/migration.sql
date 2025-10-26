/*
  Warnings:

  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `createdAt`,
    ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `passwordResetToken` VARCHAR(191) NULL,
    ADD COLUMN `tokenExpiry` DATETIME(3) NULL;
