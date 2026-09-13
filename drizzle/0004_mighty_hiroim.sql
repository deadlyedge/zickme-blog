CREATE TABLE "SyncRun" (
	"id" text PRIMARY KEY NOT NULL,
	"protocolVersion" integer DEFAULT 1 NOT NULL,
	"scope" text NOT NULL,
	"status" text NOT NULL,
	"dryRun" boolean DEFAULT false NOT NULL,
	"triggeredBy" text NOT NULL,
	"actorId" text,
	"startedAt" timestamp NOT NULL,
	"finishedAt" timestamp,
	"exitCode" integer,
	"summary" jsonb,
	"errorCount" integer DEFAULT 0 NOT NULL,
	"conflictCount" integer DEFAULT 0 NOT NULL,
	"retryOf" text,
	"lockKey" text,
	"lockExpiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sync_run_lock_unique" UNIQUE("lockKey")
);
--> statement-breakpoint
CREATE INDEX "sync_run_scope_idx" ON "SyncRun" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "sync_run_status_idx" ON "SyncRun" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_run_created_at_idx" ON "SyncRun" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "sync_run_lock_idx" ON "SyncRun" USING btree ("lockKey","lockExpiresAt");