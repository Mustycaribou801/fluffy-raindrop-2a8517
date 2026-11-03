# Publishing articles on Mustycaribou Forecasts

Articles are plain Markdown files in `content/articles/`. When you commit one to
GitHub, Netlify rebuilds the site and the article automatically:

- gets its own permanent page at `https://mustycaribou.com/articles/<file-name>.html`
- appears on the [Articles & Analysis](https://mustycaribou.com/articles.html) page (newest first)
- appears in the homepage **Latest analysis** strip if it's one of the three newest
- is added to `sitemap.xml` and the RSS feed (`/articles/feed.xml`)
- gets its page title, meta description, canonical URL, social-sharing tags and
  Google article structured data

You never need to edit HTML, JavaScript, the navigation or the sitemap.

---

## Publish a new article (in the GitHub website)

1. Open the repository on GitHub and go to `content/articles/`.
2. Open `example-article-template.md`, click **Raw**, and copy everything.
3. Back in `content/articles/`, click **Add file → Create new file**.
4. Name the file. **The file name becomes the URL**, so use lowercase letters,
   numbers and hyphens only:
   `2026-senate-outlook.md` → `/articles/2026-senate-outlook.html`
   (Don't rename a file after it's published — that changes its URL.)
5. Paste the template, fill in the fields at the top, and write the article below
   the second `---` line.
6. **Delete the `draft: true` line** (or change it to `draft: false`).
7. Click **Commit changes**. The article is live in a minute or two.

### Preview before publishing

Keep `draft: true` and commit to a **new branch**, then open a pull request.
Netlify builds a Deploy Preview where drafts are visible (with a red DRAFT
banner and hidden from search engines). Drafts are **never** shown on
mustycaribou.com. When you're happy, remove `draft: true` and merge.

---

## The fields at the top (front matter)

```yaml
---
title: "Your headline"                    # required
subtitle: "Optional standfirst"           # optional
description: "One or two sentences."      # required — cards, Google, social previews
author: "Your Name"                       # required
date: 2026-11-10                          # required — publication date (YYYY-MM-DD)
updated: 2026-11-12                       # optional — shows "Updated …"
category: Polling                         # required — see list below
image: /assets/articles/my-chart.png      # optional — featured/social image
image_alt: "What the image shows"         # recommended when you use an image
image_caption: "Caption and credit"       # optional
featured: true                            # optional — lead story on the Articles page
draft: true                               # remove to publish
sources:                                  # optional — "Sources & citations" list
  - title: "Report or dataset name"
    url: "https://…"
    publisher: "Publisher"
    date: 2026-11-01
---
```

**Categories** (must match one of these): `Election Analysis`, `Polling`,
`Forecasting`, `Australian Politics`, `US Politics`.
To add a category, add it to the `CATEGORIES` list near the top of
`scripts/build.mjs`.

**Tips**

- Put the title in quotes if it contains a colon (`:`).
- **Featured:** the newest article with `featured: true` leads the Articles
  page. If none is featured, the newest article leads.
- Reading time is calculated automatically.
- If a required field is missing or a category is misspelled, the Netlify deploy
  fails with a message naming the file and the problem — the live site keeps
  running the previous version until you fix it.

---

## Writing the article body (Markdown)

| You type                                   | You get                         |
|--------------------------------------------|---------------------------------|
| `## Section heading`                       | Section heading                 |
| `### Sub-heading`                          | Sub-heading                     |
| `**bold**`, `*italic*`                     | **bold**, *italic*              |
| `[link text](https://…)`                   | Hyperlink                       |
| `> Quoted text`                            | Pull quote                      |
| `- item`  /  `1. item`                     | Bulleted / numbered list        |
| `![Alt text](/assets/articles/x.png "Caption")` | Image or chart with caption |
| `---`                                      | Section divider                 |

**Tables**

```markdown
| Candidate | Party | Poll average |
|-----------|:-----:|-------------:|
| Name      | D     | 48.2%        |
```

`:---:` centres a column, `---:` right-aligns it. Wide tables scroll sideways on phones.

**Images and charts.** Upload images to `assets/articles/` (GitHub: **Add file
→ Upload files**), then reference them as `/assets/articles/file-name.png`.
For social previews use a JPG or PNG around 1200×630 pixels.
Interactive charts (Datawrapper, Flourish, etc.) can be embedded by pasting
their HTML embed code straight into the article.

**Rating chips** from the forecast board work inside articles:
`<span class="rating-chip TU">Toss-up</span>` (codes: `SD LD TD TU TR LR SR`).

---

## Editing or removing an article

- **Edit:** change the file and commit. Add/update `updated:` for substantive
  revisions so readers and Google see the new date.
- **Unpublish:** add `draft: true` back, or delete the file.

## How it works (for reference)

`netlify.toml` runs `npm run build`, which runs `scripts/build.mjs`. That script
copies the existing site unchanged into `_site/`, then generates the article
pages from `content/articles/*.md` using the layouts in `templates/`. Files whose
names start with `_` in `content/articles/` are ignored. Article styling lives
in the "ARTICLES & ANALYSIS" section at the bottom of `style.css`.
