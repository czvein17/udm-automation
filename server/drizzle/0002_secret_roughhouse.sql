CREATE TABLE `task_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`taskId` text,
	`logs` text NOT NULL,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_logs_id_unique` ON `task_logs` (`id`);