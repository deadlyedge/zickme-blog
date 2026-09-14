-- Stage 12 final baseline.
-- Fresh database only; do not apply to a database with the removed historical chain.

-- BEGIN final schema
CREATE TYPE "public"."Role" AS ENUM('ADMIN', 'EDITOR', 'USER');--> statement-breakpoint
CREATE TYPE "public"."StatusType" AS ENUM('PUBLISHED', 'DRAFT', 'ARCHIVED', 'PENDING', 'SPAM');--> statement-breakpoint
CREATE TYPE "public"."SyncStatus" AS ENUM('SUCCESS', 'FAILED', 'PARTIAL');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"banned" boolean DEFAULT false NOT NULL,
	"role" "Role" DEFAULT 'USER' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Comment" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"content" text NOT NULL,
	"status" "StatusType" DEFAULT 'PUBLISHED' NOT NULL,
	"edited" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"authorId" text NOT NULL,
	"parentId" text,
	"editedAt" timestamp,
	"editedBy" text,
	"deleted" boolean DEFAULT false NOT NULL,
	"deletedBy" text
);
--> statement-breakpoint
CREATE TABLE "Post" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"sourcePath" text,
	"title" text NOT NULL,
	"excerpt" text,
	"poster" text,
	"content" text,
	"status" "StatusType" DEFAULT 'PUBLISHED' NOT NULL,
	"sourceUrl" text,
	"metadata" jsonb,
	"publishedAt" timestamp,
	"archivedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Post_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "_PostToTag" (
	"A" text NOT NULL,
	"B" text NOT NULL,
	CONSTRAINT "_PostToTag_A_B_pk" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text,
	"background" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tag_name_unique" UNIQUE("name"),
	CONSTRAINT "tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "siteProfile" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"bio" text NOT NULL,
	"location" text,
	"email" text,
	"website" text,
	"avatar" text,
	"socialLinks" jsonb,
	"skills" jsonb,
	"slogans" jsonb,
	"themeConfig" jsonb,
	"landingPageConfig" jsonb,
	"aboutPageConfig" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_editedBy_user_id_fk" FOREIGN KEY ("editedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_deletedBy_user_id_fk" FOREIGN KEY ("deletedBy") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_A_Post_id_fk" FOREIGN KEY ("A") REFERENCES "public"."Post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_B_tag_id_fk" FOREIGN KEY ("B") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_post_id_idx" ON "Comment" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "comment_status_idx" ON "Comment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "comment_parent_id_idx" ON "Comment" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "comment_author_id_idx" ON "Comment" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "post_slug_idx" ON "Post" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "post_published_at_idx" ON "Post" USING btree ("publishedAt");--> statement-breakpoint
CREATE INDEX "post_status_idx" ON "Post" USING btree ("status");--> statement-breakpoint
CREATE INDEX "post_archived_at_idx" ON "Post" USING btree ("archivedAt");--> statement-breakpoint
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag" USING btree ("B");--> statement-breakpoint
CREATE INDEX "tag_slug_idx" ON "tag" USING btree ("slug");

CREATE TYPE "public"."GalleryStatus" AS ENUM('PUBLISHED', 'DRAFT', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "Gallery" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover" text,
	"status" "GalleryStatus" DEFAULT 'DRAFT' NOT NULL,
	"publishedAt" timestamp,
	"sourcePath" text NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Gallery_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "GalleryImage" (
	"id" text PRIMARY KEY NOT NULL,
	"galleryId" text NOT NULL,
	"sourcePath" text NOT NULL,
	"publicId" text,
	"url" text,
	"thumbnailUrl" text,
	"title" text,
	"description" text,
	"alt" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"width" integer,
	"height" integer,
	"exif" jsonb,
	"fileHash" text,
	"fileSize" integer,
	"sourceModifiedAt" timestamp,
	"lastSyncedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_image_gallery_source_unique" UNIQUE("galleryId","sourcePath"),
	CONSTRAINT "gallery_image_gallery_order_unique" UNIQUE("galleryId","sortOrder")
);
--> statement-breakpoint
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_galleryId_Gallery_id_fk" FOREIGN KEY ("galleryId") REFERENCES "public"."Gallery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_status_idx" ON "Gallery" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gallery_image_gallery_idx" ON "GalleryImage" USING btree ("galleryId");

CREATE TYPE "public"."GalleryImageSyncStatus" AS ENUM('LOCAL_ONLY', 'REMOTE_ONLY', 'CONFLICT', 'IN_SYNC', 'PENDING_DELETE');--> statement-breakpoint
ALTER TABLE "GalleryImage" ADD COLUMN "syncStatus" "GalleryImageSyncStatus" DEFAULT 'LOCAL_ONLY' NOT NULL;

CREATE TYPE "public"."GallerySyncStatus" AS ENUM('LOCAL_ONLY', 'REMOTE_ONLY', 'CONFLICT', 'IN_SYNC', 'PENDING_DELETE', 'ARCHIVED');--> statement-breakpoint
ALTER TABLE "Gallery" ADD COLUMN "contentHash" text;--> statement-breakpoint
ALTER TABLE "Gallery" ADD COLUMN "syncStatus" "GallerySyncStatus" DEFAULT 'LOCAL_ONLY' NOT NULL;--> statement-breakpoint
ALTER TABLE "GalleryImage" ADD COLUMN "contentHash" text;--> statement-breakpoint

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

CREATE TABLE "GalleryImageComment" (
	"id" text PRIMARY KEY NOT NULL,
	"galleryImageId" text NOT NULL,
	"content" text NOT NULL,
	"status" "StatusType" DEFAULT 'PUBLISHED' NOT NULL,
	"authorId" text NOT NULL,
	"parentId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"edited" boolean DEFAULT false NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "GalleryImageComment" ADD CONSTRAINT "GalleryImageComment_galleryImageId_GalleryImage_id_fk" FOREIGN KEY ("galleryImageId") REFERENCES "public"."GalleryImage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GalleryImageComment" ADD CONSTRAINT "GalleryImageComment_authorId_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_image_comment_image_idx" ON "GalleryImageComment" USING btree ("galleryImageId");--> statement-breakpoint
CREATE INDEX "gallery_image_comment_parent_idx" ON "GalleryImageComment" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "gallery_image_comment_author_idx" ON "GalleryImageComment" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "gallery_image_comment_status_idx" ON "GalleryImageComment" USING btree ("status");
-- END final schema

