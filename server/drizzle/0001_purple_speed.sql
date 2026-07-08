CREATE TABLE `expenses` (
	`id` varchar(64) NOT NULL,
	`groupId` varchar(64) NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`category` varchar(64) NOT NULL,
	`payerId` varchar(64) NOT NULL,
	`participants` json NOT NULL,
	`photoUrl` text,
	`date` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`shareUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `history` (
	`id` varchar(64) NOT NULL,
	`groupId` varchar(64) NOT NULL,
	`type` varchar(64) NOT NULL,
	`authorId` varchar(64),
	`description` text,
	`amount` decimal(10,2),
	`fromId` varchar(64),
	`toId` varchar(64),
	`date` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` varchar(64) NOT NULL,
	`groupId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`avatar` varchar(10) NOT NULL,
	`credentialId` text,
	`biometricEnabled` text DEFAULT ('false'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pending_payments` (
	`id` varchar(64) NOT NULL,
	`groupId` varchar(64) NOT NULL,
	`fromId` varchar(64) NOT NULL,
	`fromName` varchar(255) NOT NULL,
	`toId` varchar(64) NOT NULL,
	`toName` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','refused') NOT NULL DEFAULT 'pending',
	`date` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pending_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settlements` (
	`id` varchar(64) NOT NULL,
	`groupId` varchar(64) NOT NULL,
	`fromId` varchar(64) NOT NULL,
	`toId` varchar(64) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `settlements_id` PRIMARY KEY(`id`)
);
