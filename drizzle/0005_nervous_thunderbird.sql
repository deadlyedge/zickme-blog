CREATE TYPE "public"."SiteSnapshotSource" AS ENUM('MANUAL', 'PRE_RESTORE', 'DEPLOYMENT');--> statement-breakpoint
CREATE TYPE "public"."SiteSnapshotStatus" AS ENUM('CREATING', 'READY', 'RESTORING', 'RESTORED', 'FAILED', 'DELETED');--> statement-breakpoint
CREATE TABLE "SiteSnapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "SiteSnapshotStatus" DEFAULT 'CREATING' NOT NULL,
	"createdBy" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"source" "SiteSnapshotSource" DEFAULT 'MANUAL' NOT NULL,
	"schemaVersion" integer DEFAULT 1 NOT NULL,
	"summary" jsonb,
	"payload" jsonb,
	"payloadHash" text,
	"errorMessage" text
);
--> statement-breakpoint
CREATE INDEX "site_snapshot_status_idx" ON "SiteSnapshot" USING btree ("status");--> statement-breakpoint
CREATE INDEX "site_snapshot_created_at_idx" ON "SiteSnapshot" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "site_snapshot_source_idx" ON "SiteSnapshot" USING btree ("source");