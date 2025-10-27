-- DropForeignKey
ALTER TABLE `invite` DROP FOREIGN KEY `Invite_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `invite` DROP FOREIGN KEY `Invite_studentId_fkey`;

-- DropIndex
DROP INDEX `Invite_projectId_fkey` ON `invite`;

-- DropIndex
DROP INDEX `Invite_studentId_fkey` ON `invite`;

-- AddForeignKey
ALTER TABLE `Invite` ADD CONSTRAINT `Invite_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invite` ADD CONSTRAINT `Invite_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
