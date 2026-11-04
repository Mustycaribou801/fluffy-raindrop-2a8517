import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

export const comments = pgTable(
  "comments",
  {
    id: serial().primaryKey(),
    articleSlug: text("article_slug").notNull(),
    name: text().notNull(),
    body: text().notNull(),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_article_slug_created_at_idx").on(t.articleSlug, t.createdAt)],
);
