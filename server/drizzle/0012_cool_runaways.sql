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
CREATE INDEX `idx_reporter_run_summaries_last_ts` ON `reporter_run_summaries` (`lastTs`);