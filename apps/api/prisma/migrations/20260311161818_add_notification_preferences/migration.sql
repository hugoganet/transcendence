-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationPreferences" JSONB NOT NULL DEFAULT '{"streakReminder":true,"reengagement":true,"moduleComplete":true,"tokenThreshold":true,"streakMilestone":true}';
