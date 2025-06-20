CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"customer_id" text NOT NULL,
	"status" text DEFAULT 'active',
	"subscribed_at" timestamp DEFAULT now(),
	"canceled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"current_period_end" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;