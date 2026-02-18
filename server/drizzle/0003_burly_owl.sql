CREATE TABLE `config` (
	`id` text PRIMARY KEY NOT NULL,
	`configFor` text NOT NULL,
	`baseUrl` text,
	`surveyline` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `config_id_unique` ON `config` (`id`);