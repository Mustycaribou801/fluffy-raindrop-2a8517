/* ==========================================================
   MUSTYCARIBOU FORECASTS — site build
   ----------------------------------------------------------
   Copies the existing static site into _site/ untouched, then
   adds the Articles & Analysis section generated from the
   Markdown files in content/articles/:

     /articles.html             article index (featured + grid)
     /articles/<slug>.html      one permanent page per article
     /articles/feed.xml         RSS feed
     index.html                 "Latest Analysis" (3 newest)
     sitemap.xml                existing URLs + every article

   You should not need to edit this file to publish an article.
   See PUBLISHING.md.
   ========================================================== */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(ROOT, process.env.OUT_DIR || "_site");
const CONTENT_DIR = path.join(ROOT, "content", "articles");
const TEMPLATE_DIR = path.join(ROOT, "templates");

const SITE_URL = "https://mustycaribou.com";
const SITE_NAME = "Mustycaribou Forecasts";
const WORDS_PER_MINUTE = 230;

// The category filters on the Articles page. Front matter `category:` must
// match one of these names (case-insensitive). Add a line here to create a
// new category.
const CATEGORIES = [
  "Election Analysis",
  "Polling",
  "Forecasting",
  "Australian Politics",
  "US Politics",
];

// Drafts (`draft: true`) are never built for the live site. On Deploy
// Previews, branch deploys and local builds they are built with a DRAFT
// banner and a noindex tag so they can be reviewed before publishing.
const CONTEXT = process.env.CONTEXT || "local";
const INCLUDE_DRAFTS = process.env.INCLUDE_DRAFTS
  ? process.env.INCLUDE_DRAFTS === "true"
  : CONTEXT !== "production";

// Repo files that are tooling, not website pages.
const EXCLUDE = new Set([
  "node_modules", "content", "templates", "scripts",
  "package.json", "package-lock.json", "netlify.toml", "PUBLISHING.md",
  "db", "netlify", "drizzle.config.ts",
  path.basename(OUT),
]);

// ---------- helpers ----------
const escapeHtml = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const slugify = s => String(s).toLowerCase()
  .replace(/&[a-z]+;/g, "").replace(/<[^>]+>/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const categorySlug = name => slugify(name);

const absoluteUrl = p => /^https?:\/\//i.test(p) ? p : SITE_URL + (p.startsWith("/") ? p : "/" + p);
const sitePath = p => /^https?:\/\//i.test(p) || p.startsWith("/") ? p : "/" + p;

const readTemplate = name => fs.readFileSync(path.join(TEMPLATE_DIR, name), "utf8");
const render = (tpl, vars) => tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");

function parseDate(value, field, file){
  if (value === undefined || value === null || value === "") return null;
  const d = value instanceof Date ? value : new Date(String(value).trim());
  if (Number.isNaN(d.getTime())) fail(file, `"${field}" must be a date like 2026-11-05 (got "${value}")`);
  return d;
}
const hasTime = d => d.getUTCHours() || d.getUTCMinutes() || d.getUTCSeconds();
const isoDate = d => hasTime(d) ? d.toISOString() : d.toISOString().slice(0, 10);
const displayDate = d => d.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });

// Stops the build (the live site stays on the previous deploy) with a plain
// message that shows up in the Netlify deploy log.
function fail(file, message){
  console.error(`\n  Article error in content/articles/${file}:\n  ${message}\n`);
  process.exit(1);
}

// ---------- Markdown ----------
marked.use({
  gfm: true,
  renderer: {
    heading({ tokens, depth }){
      const text = this.parser.parseInline(tokens);
      return `<h${depth} id="${slugify(text)}">${text}</h${depth}>\n`;
    },
    image({ href, title, text }){
      const img = `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" loading="lazy" decoding="async">`;
      return title
        ? `<figure class="article-figure">${img}<figcaption>${escapeHtml(title)}</figcaption></figure>`
        : `<figure class="article-figure">${img}</figure>`;
    },
    link({ href, title, tokens }){
      const text = this.parser.parseInline(tokens);
      const external = /^https?:\/\//i.test(href) && !href.startsWith(SITE_URL);
      return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ""}${external ? ' rel="noopener"' : ""}>${text}</a>`;
    },
  },
});

function markdownToHtml(md){
  return marked.parse(md)
    // Figures can't live inside paragraphs.
    .replace(/<p>\s*(<figure[\s\S]*?<\/figure>)\s*<\/p>/g, "$1")
    // Wide tables scroll sideways on phones instead of breaking the layout.
    .replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, "</table></div>");
}

function readingMinutes(md){
  const words = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// ---------- load articles ----------
function loadArticles(){
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith(".md") && !f.startsWith("_"));
  const seen = new Map();
  const articles = [];

  for (const file of files){
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    let parsed;
    try { parsed = matter(raw); }
    catch (e){ fail(file, `the front matter between the --- lines is not valid YAML (${e.reason || e.message}). Wrap titles containing a colon in quotes.`); }
    const fm = parsed.data;

    const draft = fm.draft === true;
    if (draft && !INCLUDE_DRAFTS) continue;

    const slug = file.replace(/\.md$/, "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){
      fail(file, `file names become URLs, so use only lowercase letters, numbers and hyphens (e.g. "2026-senate-outlook.md").`);
    }
    for (const field of ["title", "description", "author", "date", "category"]){
      if (fm[field] === undefined || fm[field] === null || String(fm[field]).trim() === ""){
        fail(file, `"${field}" is required in the front matter.`);
      }
    }
    const category = CATEGORIES.find(c => c.toLowerCase() === String(fm.category).trim().toLowerCase());
    if (!category) fail(file, `"category" must be one of: ${CATEGORIES.join(", ")} (got "${fm.category}").`);

    const date = parseDate(fm.date, "date", file);
    const updated = parseDate(fm.updated, "updated", file);

    const sources = (Array.isArray(fm.sources) ? fm.sources : []).map((s, i) => {
      if (typeof s === "string") return { title: s, url: /^https?:\/\//.test(s) ? s : "" };
      if (!s || !s.title) fail(file, `source #${i + 1} needs a "title".`);
      return s;
    });

    if (seen.has(slug)) fail(file, `duplicate URL — "${seen.get(slug)}" already uses /articles/${slug}.html`);
    seen.set(slug, file);

    articles.push({
      file, slug, draft, category,
      title: String(fm.title).trim(),
      subtitle: fm.subtitle ? String(fm.subtitle).trim() : "",
      description: String(fm.description).trim(),
      author: String(fm.author).trim(),
      date, updated: updated && updated > date ? updated : null,
      image: fm.image ? String(fm.image).trim() : "",
      imageAlt: fm.image_alt ? String(fm.image_alt).trim() : "",
      imageCaption: fm.image_caption ? String(fm.image_caption).trim() : "",
      featured: fm.featured === true,
      sources,
      minutes: readingMinutes(parsed.content),
      html: markdownToHtml(parsed.content),
      url: `/articles/${slug}.html`,
    });
  }

  return articles.sort((a, b) => b.date - a.date || a.title.localeCompare(b.title));
}

// ---------- shared markup ----------
const header = readTemplate("_header.html");
const footer = readTemplate("_footer.html");

function metaLine(a, { withAuthor = true } = {}){
  return [
    withAuthor ? `<span class="article-meta-author">${escapeHtml(a.author)}</span>` : "",
    `<time datetime="${isoDate(a.date)}">${displayDate(a.date)}</time>`,
    `<span>${a.minutes} min read</span>`,
  ].filter(Boolean).join('<span class="article-meta-sep" aria-hidden="true">&middot;</span>');
}

function categoryTag(a){
  return `<span class="article-category">${escapeHtml(a.category)}</span>${a.draft ? '<span class="article-draft-tag">Draft</span>' : ""}`;
}

function articleCard(a, { variant = "", extraClass = "", headingLevel = 3 } = {}){
  const h = `h${headingLevel}`;
  const img = a.image && variant === "featured"
    ? `<a class="article-card-media" href="${a.url}" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(sitePath(a.image))}" alt="" loading="lazy" decoding="async"></a>`
    : "";
  return `
      <article class="article-card${variant ? ` article-card--${variant}` : ""}${extraClass ? ` ${extraClass}` : ""}" data-category="${categorySlug(a.category)}">
        ${img}
        <div class="article-card-body">
          <div class="article-card-top">${categoryTag(a)}</div>
          <${h} class="article-card-title"><a href="${a.url}">${escapeHtml(a.title)}</a></${h}>
          <p class="article-card-summary">${escapeHtml(a.description)}</p>
          <p class="article-meta">${metaLine(a)}</p>
        </div>
      </article>`;
}

function headTags({ title, ogTitle = title, description, canonical, type = "website", image = "", imageAlt = "", noindex = false, extra = "" }){
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    noindex ? `<meta name="robots" content="noindex, nofollow">` : `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:title" content="${escapeHtml(ogTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    image ? `<meta property="og:image" content="${escapeHtml(absoluteUrl(image))}">` : "",
    image && imageAlt ? `<meta property="og:image:alt" content="${escapeHtml(imageAlt)}">` : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${escapeHtml(ogTitle)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    image ? `<meta name="twitter:image" content="${escapeHtml(absoluteUrl(image))}">` : "",
    `<link rel="alternate" type="application/rss+xml" title="${SITE_NAME} — Articles &amp; Analysis" href="/articles/feed.xml">`,
    extra,
  ].filter(Boolean).join("\n");
}

const jsonLd = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

// ---------- article pages ----------
function relatedFor(article, all){
  // Published pages never link to drafts.
  const others = all.filter(a => a !== article && (!a.draft || article.draft));
  const same = others.filter(a => a.category === article.category);
  const rest = others.filter(a => a.category !== article.category);
  return [...same, ...rest].slice(0, 3);
}

function sourcesMarkup(sources){
  if (!sources.length) return "";
  const items = sources.map(s => {
    const title = s.url
      ? `<a href="${escapeHtml(s.url)}" rel="noopener">${escapeHtml(s.title)}</a>`
      : escapeHtml(s.title);
    const extra = [s.publisher, s.date instanceof Date ? displayDate(s.date) : s.date]
      .filter(Boolean).map(escapeHtml).join(", ");
    return `<li>${title}${extra ? ` <span class="source-meta">— ${extra}</span>` : ""}</li>`;
  }).join("\n");
  return `
    <section class="article-sources" aria-labelledby="sources-heading">
      <h2 id="sources-heading">Sources &amp; citations</h2>
      <ol>${items}</ol>
    </section>`;
}

function buildArticlePage(a, all, tpl){
  const canonical = SITE_URL + a.url;
  const related = relatedFor(a, all);
  const fullTitle = `${a.title} — ${SITE_NAME}`;

  const structured = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title.slice(0, 110),
    description: a.description,
    articleSection: a.category,
    datePublished: isoDate(a.date),
    dateModified: isoDate(a.updated || a.date),
    author: { "@type": "Person", name: a.author },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL + "/" },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    url: canonical,
    ...(a.image ? { image: [absoluteUrl(a.image)] } : {}),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: "Articles", item: SITE_URL + "/articles.html" },
      { "@type": "ListItem", position: 3, name: a.title, item: canonical },
    ],
  };

  const head = headTags({
    title: fullTitle,
    ogTitle: a.title,
    description: a.description,
    canonical,
    type: "article",
    image: a.image,
    imageAlt: a.imageAlt,
    noindex: a.draft,
    extra: [
      `<meta property="article:published_time" content="${isoDate(a.date)}">`,
      a.updated ? `<meta property="article:modified_time" content="${isoDate(a.updated)}">` : "",
      `<meta property="article:section" content="${escapeHtml(a.category)}">`,
      `<meta name="author" content="${escapeHtml(a.author)}">`,
      a.draft ? "" : jsonLd(structured),
      a.draft ? "" : jsonLd(breadcrumbs),
    ].filter(Boolean).join("\n"),
  });

  const dates = [
    `<span>Published <time datetime="${isoDate(a.date)}">${displayDate(a.date)}</time></span>`,
    a.updated ? `<span>Updated <time datetime="${isoDate(a.updated)}">${displayDate(a.updated)}</time></span>` : "",
    `<span>${a.minutes} min read</span>`,
  ].filter(Boolean).join('<span class="article-meta-sep" aria-hidden="true">&middot;</span>');

  const heroImage = a.image ? `
      <figure class="article-hero-figure">
        <img src="${escapeHtml(sitePath(a.image))}" alt="${escapeHtml(a.imageAlt)}" decoding="async">
        ${a.imageCaption ? `<figcaption>${escapeHtml(a.imageCaption)}</figcaption>` : ""}
      </figure>` : "";

  const shareText = encodeURIComponent(a.title);
  const shareUrl = encodeURIComponent(canonical);

  return render(tpl, {
    head,
    header,
    footer,
    draftBanner: a.draft
      ? `<div class="article-draft-banner" role="note"><strong>Draft</strong> — this article is not published. It is visible only on previews and will not appear on mustycaribou.com until <code>draft: true</code> is removed.</div>`
      : "",
    categoryHref: `/articles.html?category=${categorySlug(a.category)}`,
    category: categoryTag(a),
    categoryName: escapeHtml(a.category),
    title: escapeHtml(a.title),
    subtitle: a.subtitle ? `<p class="article-subtitle">${escapeHtml(a.subtitle)}</p>` : "",
    author: escapeHtml(a.author),
    dates,
    heroImage,
    body: a.html,
    sources: sourcesMarkup(a.sources),
    shareUrl,
    shareText,
    canonical,
    slug: a.slug,
    related: related.length ? `
    <section class="wrap article-related" aria-labelledby="related-heading">
      <div class="section-heading article-section-heading">
        <h2 id="related-heading">Related analysis</h2>
        <a class="section-link" href="/articles.html">All articles &rarr;</a>
      </div>
      <div class="article-grid article-grid--related">${related.map(r => articleCard(r)).join("")}
      </div>
    </section>` : "",
  });
}

// ---------- article index ----------
function buildIndexPage(articles, tpl){
  const featured = articles.find(a => a.featured) || articles[0];
  const counts = Object.fromEntries(CATEGORIES.map(c => [c, articles.filter(a => a.category === c).length]));

  const filters = [
    `<button type="button" class="article-filter" data-filter="all" aria-pressed="true">All <span class="article-filter-count">${articles.length}</span></button>`,
    ...CATEGORIES.map(c => `<button type="button" class="article-filter" data-filter="${categorySlug(c)}" aria-pressed="false">${escapeHtml(c)} <span class="article-filter-count">${counts[c]}</span></button>`),
  ].join("\n        ");

  const featuredMarkup = featured ? `
    <section class="wrap article-featured" id="featured-article" aria-label="Featured article">
      <p class="section-label">Featured</p>${articleCard(featured, { variant: "featured", headingLevel: 2 })}
    </section>` : "";

  const grid = articles.length
    ? articles.map(a => articleCard(a, { extraClass: a === featured ? "is-featured" : "" })).join("")
    : "";

  const itemList = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Articles & Analysis",
    url: SITE_URL + "/articles.html",
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL + "/" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.filter(a => !a.draft).map((a, i) => ({
        "@type": "ListItem", position: i + 1, url: SITE_URL + a.url, name: a.title,
      })),
    },
  };

  return render(tpl, {
    head: headTags({
      title: `Articles & Analysis — ${SITE_NAME}`,
      description: "Independent election analysis, polling commentary and forecasting articles from Mustycaribou Forecasts, covering U.S. and Australian politics.",
      canonical: SITE_URL + "/articles.html",
      extra: jsonLd(itemList),
    }),
    header,
    footer,
    filters,
    featured: featuredMarkup,
    grid,
    emptyClass: articles.length ? "" : " is-empty",
  });
}

// ---------- homepage "Latest Analysis" ----------
function latestSection(articles){
  const latest = articles.slice(0, 3);
  if (!latest.length) return "";
  return `
  <section class="wrap latest-analysis" aria-labelledby="latest-analysis-heading">
    <div class="section-heading home-section-heading">
      <div>
        <p class="section-label">Articles &amp; Analysis</p>
        <h2 id="latest-analysis-heading">Latest analysis</h2>
      </div>
      <a class="section-link" href="/articles.html">View all articles &rarr;</a>
    </div>
    <div class="article-grid article-grid--latest">${latest.map(a => articleCard(a, { variant: "compact" })).join("")}
    </div>
  </section>`;
}

// ---------- sitemap + feed ----------
function buildSitemap(articles){
  const file = path.join(OUT, "sitemap.xml");
  const xml = fs.readFileSync(file, "utf8");
  const published = articles.filter(a => !a.draft);
  const lastmod = published.length ? `\n    <lastmod>${isoDate(published[0].updated || published[0].date).slice(0, 10)}</lastmod>` : "";
  const entries = [
    `  <url>\n    <loc>${SITE_URL}/articles.html</loc>${lastmod}\n  </url>`,
    ...published.map(a => `  <url>\n    <loc>${SITE_URL}${a.url}</loc>\n    <lastmod>${isoDate(a.updated || a.date).slice(0, 10)}</lastmod>\n  </url>`),
  ].join("\n\n");
  fs.writeFileSync(file, xml.replace(/<\/urlset>/, `${entries}\n\n</urlset>`));
}

function buildFeed(articles){
  const cdata = s => `<![CDATA[${String(s).replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
  const items = articles.filter(a => !a.draft).slice(0, 50).map(a => `
    <item>
      <title>${cdata(a.title)}</title>
      <link>${SITE_URL}${a.url}</link>
      <guid isPermaLink="true">${SITE_URL}${a.url}</guid>
      <pubDate>${a.date.toUTCString()}</pubDate>
      <category>${cdata(a.category)}</category>
      <dc:creator>${cdata(a.author)}</dc:creator>
      <description>${cdata(a.description)}</description>
    </item>`).join("");
  fs.writeFileSync(path.join(OUT, "articles", "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} — Articles &amp; Analysis</title>
    <link>${SITE_URL}/articles.html</link>
    <atom:link href="${SITE_URL}/articles/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Independent election analysis, polling commentary and forecasting.</description>
    <language>en</language>${items}
  </channel>
</rss>
`);
}

// ---------- run ----------
function copySite(){
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const entry of fs.readdirSync(ROOT)){
    if (entry.startsWith(".") || EXCLUDE.has(entry)) continue;
    fs.cpSync(path.join(ROOT, entry), path.join(OUT, entry), { recursive: true });
  }
}

const articles = loadArticles();
copySite();
fs.mkdirSync(path.join(OUT, "articles"), { recursive: true });

const articleTpl = readTemplate("article.html");
for (const a of articles){
  fs.writeFileSync(path.join(OUT, "articles", `${a.slug}.html`), buildArticlePage(a, articles, articleTpl));
}
fs.writeFileSync(path.join(OUT, "articles.html"), buildIndexPage(articles, readTemplate("articles.html")));

const indexFile = path.join(OUT, "index.html");
const indexHtml = fs.readFileSync(indexFile, "utf8");
if (!indexHtml.includes("<!-- LATEST_ANALYSIS -->")) {
  console.warn("! index.html has no <!-- LATEST_ANALYSIS --> marker; homepage section skipped.");
}
fs.writeFileSync(indexFile, indexHtml.replace("<!-- LATEST_ANALYSIS -->", latestSection(articles)));

buildSitemap(articles);
buildFeed(articles);

const drafts = articles.filter(a => a.draft).length;
console.log(`Built ${articles.length - drafts} published article(s)${drafts ? ` and ${drafts} draft preview(s)` : ""} [context: ${CONTEXT}] -> ${path.relative(ROOT, OUT) || OUT}`);
for (const a of articles) console.log(`  ${a.draft ? "draft    " : "published"}  ${a.url}`);
