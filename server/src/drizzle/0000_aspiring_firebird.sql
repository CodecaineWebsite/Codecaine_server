CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"pen_id" integer NOT NULL,
<<<<<<<< HEAD:server/src/drizzle/0000_superb_husk.sql
	"user_id" varchar NOT NULL,
========
	"user_id" varchar(1000) NOT NULL,
>>>>>>>> bd3d307d781093c217e7d3e83e8da02459992072:server/src/drizzle/0000_aspiring_firebird.sql
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorites" (
<<<<<<<< HEAD:server/src/drizzle/0000_superb_husk.sql
	"user_id" varchar NOT NULL,
========
	"user_id" varchar(1000) NOT NULL,
>>>>>>>> bd3d307d781093c217e7d3e83e8da02459992072:server/src/drizzle/0000_aspiring_firebird.sql
	"pen_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "favorites_user_id_pen_id_pk" PRIMARY KEY("user_id","pen_id")
);
--> statement-breakpoint
CREATE TABLE "follows" (
<<<<<<<< HEAD:server/src/drizzle/0000_superb_husk.sql
	"follower_id" varchar NOT NULL,
	"following_id" varchar NOT NULL,
========
	"follower_id" varchar(1000) NOT NULL,
	"following_id" varchar(1000) NOT NULL,
>>>>>>>> bd3d307d781093c217e7d3e83e8da02459992072:server/src/drizzle/0000_aspiring_firebird.sql
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "pen_tags" (
	"pen_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "pen_tags_pen_id_tag_id_pk" PRIMARY KEY("pen_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "pens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
<<<<<<<< HEAD:server/src/drizzle/0000_superb_husk.sql
	"user_id" varchar,
========
	"user_id" varchar(1000),
>>>>>>>> bd3d307d781093c217e7d3e83e8da02459992072:server/src/drizzle/0000_aspiring_firebird.sql
	"html_code" text,
	"css_code" text,
	"js_code" text,
	"title" varchar(100) NOT NULL,
	"description" text,
	"is_private" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(1000) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"is_pro" boolean DEFAULT false,
	"profile_image" text,
	"display_name" varchar(100),
	"location" varchar(255),
	"bio" text,
	"profile_link1" text,
	"profile_link2" text,
	"profile_link3" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_pen_id_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."pens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_pen_id_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."pens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pen_tags" ADD CONSTRAINT "pen_tags_pen_id_pens_id_fk" FOREIGN KEY ("pen_id") REFERENCES "public"."pens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pen_tags" ADD CONSTRAINT "pen_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pens" ADD CONSTRAINT "pens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;