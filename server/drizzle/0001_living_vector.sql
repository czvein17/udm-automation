ALTER TABLE `users` RENAME TO `tasks`;--> statement-breakpoint
DROP INDEX `users_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_id_unique` ON `tasks` (`id`);