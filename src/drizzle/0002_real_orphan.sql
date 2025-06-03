ALTER TABLE "users" RENAME COLUMN "profile_image" TO "profile_image_url";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "profile_key" TO "profile_image_key";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "avatar_last_updated" TO "profile_image_last_updated";