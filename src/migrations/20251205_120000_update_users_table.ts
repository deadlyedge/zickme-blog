import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add new columns to users table
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN "lastLoginAt" timestamp(3) with time zone;
    ALTER TABLE "users" ADD COLUMN "commentsCount" numeric DEFAULT 0;
    ALTER TABLE "users" ADD COLUMN "profile_nickname" varchar;
    ALTER TABLE "users" ADD COLUMN "profile_avatar_id" integer;
    ALTER TABLE "users" ADD COLUMN "profile_bio" varchar;
    ALTER TABLE "users" ADD COLUMN "profile_location" varchar;
    ALTER TABLE "users" ADD COLUMN "profile_website" varchar;
    ALTER TABLE "users" ADD COLUMN "profile_github" varchar;
    ALTER TABLE "users" ADD COLUMN "profile_twitter" varchar;
  `)

  // Add foreign key constraint for avatar
  await db.execute(sql`
    ALTER TABLE "users" ADD CONSTRAINT "users_profile_avatar_id_media_id_fk" 
    FOREIGN KEY ("profile_avatar_id") REFERENCES "media"("id") ON DELETE set null ON UPDATE no action;
  `)

  // Create indexes for new columns
  await db.execute(sql`
    CREATE INDEX "users_lastLoginAt_idx" ON "users" USING btree ("lastLoginAt");
    CREATE INDEX "users_commentsCount_idx" ON "users" USING btree ("commentsCount");
    CREATE INDEX "users_profile_avatar_idx" ON "users" USING btree ("profile_avatar_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Drop foreign key constraint first
  await db.execute(sql`
    ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_profile_avatar_id_media_id_fk";
  `)

  // Remove the new columns
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "lastLoginAt";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "commentsCount";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_nickname";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_avatar_id";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_bio";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_location";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_website";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_github";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "profile_twitter";
  `)

  // Drop indexes if they exist
  await db.execute(sql`
    DROP INDEX IF EXISTS "users_lastLoginAt_idx";
    DROP INDEX IF EXISTS "users_commentsCount_idx";
    DROP INDEX IF EXISTS "users_profile_avatar_idx";
  `)
}
