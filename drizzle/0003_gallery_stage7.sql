CREATE TYPE "public"."GallerySyncStatus" AS ENUM('LOCAL_ONLY', 'REMOTE_ONLY', 'CONFLICT', 'IN_SYNC', 'PENDING_DELETE', 'ARCHIVED');--> statement-breakpoint
ALTER TABLE "Gallery" ADD COLUMN "contentHash" text;--> statement-breakpoint
ALTER TABLE "Gallery" ADD COLUMN "mergeBase" jsonb;--> statement-breakpoint
ALTER TABLE "Gallery" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Gallery" ADD COLUMN "syncStatus" "GallerySyncStatus" DEFAULT 'LOCAL_ONLY' NOT NULL;--> statement-breakpoint
ALTER TABLE "GalleryImage" ADD COLUMN "contentHash" text;--> statement-breakpoint
ALTER TABLE "GalleryImage" ADD COLUMN "mergeBase" jsonb;