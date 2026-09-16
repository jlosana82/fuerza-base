CREATE TABLE `body_measurements` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_body_measurements_parent` ON `body_measurements` (`user_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `exercise_progressions` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_exercise_progressions_parent` ON `exercise_progressions` (`user_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `exercise_sessions` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_exercise_sessions_parent` ON `exercise_sessions` (`user_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_exercises_parent` ON `exercises` (`user_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `personal_records` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_personal_records_parent` ON `personal_records` (`user_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `routine_exercises` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_routine_exercises_parent` ON `routine_exercises` (`user_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_routines_parent` ON `routines` (`user_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `sets` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sets_parent` ON `sets` (`user_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`operation` text NOT NULL,
	`settings` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workout_days` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_workout_days_parent` ON `workout_days` (`user_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`position` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`user_id`, `id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_workout_sessions_parent` ON `workout_sessions` (`user_id`,`parent_id`);