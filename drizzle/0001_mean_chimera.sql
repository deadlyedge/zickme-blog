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
	"syncVersion" integer DEFAULT 0 NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_image_gallery_source_unique" UNIQUE("galleryId","sourcePath"),
	CONSTRAINT "gallery_image_gallery_order_unique" UNIQUE("galleryId","sortOrder")
);
--> statement-breakpoint
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_galleryId_Gallery_id_fk" FOREIGN KEY ("galleryId") REFERENCES "public"."Gallery"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_status_idx" ON "Gallery" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gallery_image_gallery_idx" ON "GalleryImage" USING btree ("galleryId");