ALTER TABLE "comments" ALTER COLUMN "user_id" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "favorites" ALTER COLUMN "user_id" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "follows" ALTER COLUMN "follower_id" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "follows" ALTER COLUMN "following_id" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "pens" ALTER COLUMN "user_id" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_key" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_last_updated" timestamp DEFAULT now();