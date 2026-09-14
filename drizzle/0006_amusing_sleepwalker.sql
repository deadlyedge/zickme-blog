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