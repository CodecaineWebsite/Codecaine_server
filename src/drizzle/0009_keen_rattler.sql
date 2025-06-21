ALTER TABLE "ai_chats" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_messages" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_chats" ADD COLUMN "status" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD COLUMN "status" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD COLUMN "message_index" integer NOT NULL;