-- Stage 12: clear legacy bidirectional-sync payloads without dropping columns.
-- This migration intentionally preserves schema, comments, media references,
-- sync history rows, and Gallery syncStatus runtime values.
UPDATE "Gallery"
SET "mergeBase" = NULL;
--> statement-breakpoint
UPDATE "GalleryImage"
SET "mergeBase" = NULL,
    "syncVersion" = 0,
    "revision" = 0;
--> statement-breakpoint
UPDATE "SyncRun"
SET "retryOf" = NULL;