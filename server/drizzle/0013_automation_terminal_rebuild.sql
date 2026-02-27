CREATE TABLE IF NOT EXISTS `automation_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `engine` text NOT NULL DEFAULT 'udm',
  `status` text NOT NULL DEFAULT 'RUNNING',
  `createdAt` text NOT NULL,
  `updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `automation_tasks` (
  `id` text PRIMARY KEY NOT NULL,
  `runId` text NOT NULL,
  `fieldName` text,
  `elementId` text,
  `tableName` text,
  `elementName` text,
  `displayName` text,
  `url` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `automation_events` (
  `id` text PRIMARY KEY NOT NULL,
  `runId` text NOT NULL,
  `taskId` text NOT NULL,
  `seq` integer NOT NULL,
  `type` text NOT NULL,
  `details` text NOT NULL,
  `payloadJson` text,
  `createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_automation_tasks_run_id` ON `automation_tasks` (`runId`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_automation_events_run_seq_unique` ON `automation_events` (`runId`,`seq`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_automation_events_run_seq` ON `automation_events` (`runId`,`seq`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_automation_events_run_task_seq` ON `automation_events` (`runId`,`taskId`,`seq`);
--> statement-breakpoint
DROP TABLE IF EXISTS `automation_logs`;
--> statement-breakpoint
DROP TABLE IF EXISTS `reporter_run_summaries`;
--> statement-breakpoint
DROP TABLE IF EXISTS `task_logs`;
