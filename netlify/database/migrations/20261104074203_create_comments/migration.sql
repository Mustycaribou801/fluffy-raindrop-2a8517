CREATE TABLE "comments" (
	"id" serial PRIMARY KEY,
	"article_slug" text NOT NULL,
	"name" text NOT NULL,
	"body" text NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "comments_article_slug_created_at_idx" ON "comments" ("article_slug","created_at");