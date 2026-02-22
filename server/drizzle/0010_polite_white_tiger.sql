CREATE TABLE `automation_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`runId` text NOT NULL,
	`jobId` text,
	`runnerId` text,
	`ts` text NOT NULL,
	`level` text NOT NULL,
	`message` text NOT NULL,
	`metaJson` text,
	`raw` text,
	`seq` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `automation_logs_id_unique` ON `automation_logs` (`id`);--> statement-breakpoint
CREATE INDEX `idx_automation_logs_run_seq` ON `automation_logs` (`runId`,`seq`);--> statement-breakpoint
CREATE INDEX `idx_automation_logs_run_ts` ON `automation_logs` (`runId`,`ts`);--> statement-breakpoint
CREATE TABLE `reporter_run_summaries` (
	`runId` text PRIMARY KEY NOT NULL,
	`jobId` text,
	`runnerId` text,
	`firstTs` text NOT NULL,
	`lastTs` text NOT NULL,
	`totalEvents` integer DEFAULT 0 NOT NULL,
	`errorCount` integer DEFAULT 0 NOT NULL,
	`warnCount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`latestMessage` text NOT NULL,
	`lastSeq` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reporter_run_summaries_last_seq` ON `reporter_run_summaries` (`lastSeq`);--> statement-breakpoint
CREATE INDEX `idx_reporter_run_summaries_last_ts` ON `reporter_run_summaries` (`lastTs`);--> statement-breakpoint
CREATE INDEX `idx_task_logs_task_id` ON `task_logs` (`taskId`);