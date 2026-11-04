import type { Config, Context } from "@netlify/functions";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "../../db/index.js";
import { comments } from "../../db/schema.js";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME = 60;
const MAX_BODY = 3000;
// Max comments one visitor can post in RATE_WINDOW_MS.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

const publicFields = {
  id: comments.id,
  name: comments.name,
  body: comments.body,
  createdAt: comments.createdAt,
};

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const slug = url.searchParams.get("article") || "";
    if (!SLUG_RE.test(slug)) return json({ error: "Invalid article." }, 400);
    const rows = await db
      .select(publicFields)
      .from(comments)
      .where(eq(comments.articleSlug, slug))
      .orderBy(asc(comments.createdAt))
      .limit(500);
    return json({ comments: rows });
  }

  if (req.method === "POST") {
    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Invalid request." }, 400);
    }

    // Honeypot: real visitors never fill this hidden field.
    if (typeof payload.website === "string" && payload.website.trim() !== "") {
      return json({ ok: true }, 201);
    }

    const slug = String(payload.article ?? "");
    const name = String(payload.name ?? "").trim().replace(/\s+/g, " ");
    const body = String(payload.body ?? "").trim().replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

    if (!SLUG_RE.test(slug)) return json({ error: "Invalid article." }, 400);
    if (!name) return json({ error: "Please enter your name." }, 400);
    if (name.length > MAX_NAME) return json({ error: `Name must be ${MAX_NAME} characters or fewer.` }, 400);
    if (!body) return json({ error: "Please write a comment." }, 400);
    if (body.length > MAX_BODY) return json({ error: `Comments must be ${MAX_BODY} characters or fewer.` }, 400);

    const ipHash = createHash("sha256")
      .update(`${context.ip || "unknown"}:${context.site?.id || ""}`)
      .digest("hex");

    const since = new Date(Date.now() - RATE_WINDOW_MS);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(and(eq(comments.ipHash, ipHash), gt(comments.createdAt, since)));
    if (count >= RATE_LIMIT) {
      return json({ error: "You're commenting too quickly. Please try again in a few minutes." }, 429);
    }

    const [created] = await db
      .insert(comments)
      .values({ articleSlug: slug, name, body, ipHash })
      .returning(publicFields);
    return json({ comment: created }, 201);
  }

  return json({ error: "Method not allowed." }, 405);
};

export const config: Config = {
  path: "/api/comments",
};
