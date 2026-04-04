-- AlterTable
ALTER TABLE "User" ALTER COLUMN "notificationPreferences" SET DEFAULT '{"streakReminder":true,"reengagement":true,"moduleComplete":true,"tokenThreshold":true,"streakMilestone":true,"friendRequest":true,"messageReceived":true}';
