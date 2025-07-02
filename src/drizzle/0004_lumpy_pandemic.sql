ALTER TABLE "pens" ALTER COLUMN "title" SET DEFAULT 'untitled';--> statement-breakpoint
ALTER TABLE "pens" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pens" ALTER COLUMN "description" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "resources_css" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "resources_js" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "favorites_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "comments_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "views_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "view_mode" varchar(32) DEFAULT 'center';--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "is_autosave" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "is_autopreview" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "pens" ADD COLUMN "deleted_at" timestamp;