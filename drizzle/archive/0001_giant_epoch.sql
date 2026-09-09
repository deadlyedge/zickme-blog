CREATE TYPE "public"."SyncStatus" AS ENUM('SUCCESS', 'FAILED', 'PARTIAL');--> statement-breakpoint
CREATE TABLE "SyncLog" (
	"id" text PRIMARY KEY NOT NULL,
	"triggerType" text DEFAULT 'MANUAL' NOT NULL,
	"status" "SyncStatus" DEFAULT 'SUCCESS' NOT NULL,
	"totalPosts" text DEFAULT '0',
	"successCount" text DEFAULT '0',
	"errorCount" text DEFAULT '0',
	"logs" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
