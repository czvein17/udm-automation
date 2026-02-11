CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`runId` text NOT NULL,
	`fieldName` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_unique` ON `users` (`id`);