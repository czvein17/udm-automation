DROP TABLE IF EXISTS `automation_logs`;--> statement-breakpoint
DROP TABLE IF EXISTS `reporter_run_summaries`;--> statement-breakpoint
DROP TABLE IF EXISTS `task_logs`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_config` (
	`id` text PRIMARY KEY NOT NULL,
	`configFor` text DEFAULT 'udm' NOT NULL,
	`baseUrl` text DEFAULT 'https://axis.ehr.com/en-US/survey-setup/surveys',
	`surveyline` text DEFAULT '48',
	`automationType` text DEFAULT 'udm:open_elem' NOT NULL,
	`translation` text DEFAULT 'English' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_config`("id", "configFor", "baseUrl", "surveyline", "automationType", "translation") SELECT "id", "configFor", "baseUrl", "surveyline", "automationType", "translation" FROM `config`;--> statement-breakpoint
DROP TABLE `config`;--> statement-breakpoint
ALTER TABLE `__new_config` RENAME TO `config`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `config_id_unique` ON `config` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `config_configFor_unique` ON `config` (`configFor`);