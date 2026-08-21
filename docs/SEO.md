# ORIVIDA SEO

How search metadata is stored, generated and managed. Written for whoever
maintains the store next — including the non-technical part, which is the
section admins actually need.

---

## 1. Architecture

The storefront is a React (Vite) SPA talking to an Express + PostgreSQL API,
so SEO is split across three layers:

| Layer | Responsibility | Files |
|---|---|---|
| Database | Per-entity overrides and global settings | `server/src/db/migrations.sql` §13 |
| Server | Sitemap, robots, redirects, audit, bulk tools | `server/src/services/seoService.js`, `server/src/controllers/seoController.js` |
| Client | Metadata + structured data per route, admin UI | `client/src/lib/seo.js`, `client/src/hooks/usePageMeta.js` |

**Resolution order.** Every value resolves the same way, and nothing is stored
that can be derived:

```
admin override  →  the entity's own content  →  global default
```

So a product with no SEO title still gets `Product Name | ORIVIDA`, and an
admin who later fills the field simply takes over. This is why SEO columns are
nullable and why bulk tools never overwrite a non-empty value.

---

## 2. Database changes

Migration §13 is additive and nullable — safe on a live database.

**`products`** — `seo_title`, `seo_description`, `seo_keywords`,
`canonical_url`, `meta_robots`, `og_title`, `og_description`, `og_image`,
`twitter_title`, `twitter_description`, `twitter_image`, `image_alt_text`

**`categories`** — the same minus the Twitter trio, plus `updated_at`

**`subcategories`** — `seo_title`, `seo_description`, `meta_robots`,
`og_image`, `image_alt_text`

**`redirects`** (new) — `source` (unique path), `destination`, `status_code`,
`entity_type`, `entity_id`, `hits`, timestamps

**Global settings** live in the existing `site_content` table under the
`seo_settings` key rather than a new table, because they are a single JSON
document edited in one place.

Apply with `npm run db:migrate` from `server/`. Never run `migrate reset`
against production.

---

## 3. Admin controls

### Product SEO — Admin → Products → edit → "Search engine optimisation"

A collapsed section (it stays out of the way) containing SEO title, meta
description, URL slug, robots, image alt text, keywords, canonical URL, and
optional OG/Twitter overrides. It shows a live **Google preview**, a **social
card preview**, and a completeness checklist.

Character counts are **recommendations, not validation** — 50–60 for titles,
140–160 for descriptions. The counter turns amber outside that range but never
blocks saving.

### Category SEO — Admin → Categories → edit

The same block, minus Twitter-specific fields.

### Global — Admin → Site Content → "SEO — search & social"

Six groups: General (site name, title template), Homepage (title,
description), Social sharing (default image, card type), Organisation (name,
logo, description, phone, email, address, social profiles), Google
integrations (Search Console, GA4, GTM).

### SEO dashboard — Admin → SEO

Health score, per-check coverage, "fill the gaps" bulk actions, a list of
products still missing each field, and redirect management.

---

## 4. Everyday workflow

**Adding a product.** Fill the normal fields and save. SEO is optional — the
storefront falls back to the product's name, description and first image, and
the slug is generated automatically. Come back and refine the SEO section for
products that matter commercially.

**Renaming a URL.** Edit the slug in the SEO section. The old URL keeps
working: a 301 redirect is recorded automatically, existing redirects that
pointed at the old path are repointed at the new one (no chains), and loops
are refused.

**Writing good metadata.**

- *Title* — lead with the product, then a distinguishing detail:
  `Zamia Black — Rare Near-Black ZZ Plant`. Don't repeat the brand; the title
  template appends it.
- *Description* — one or two sentences a shopper would actually click, using
  the words they'd search. Not a keyword list.
- *Alt text* — describe the photograph: "Zamia Black in a terracotta pot".
- *Robots* — leave on "Index, Follow" unless you deliberately want a page
  hidden from Google.

---

## 5. What happens automatically

- **Metadata** — title, description, canonical, OG and Twitter tags on every
  route (`usePageMeta`).
- **Structured data** — Product (with real price, stock-derived availability
  and ratings only where reviews exist), BreadcrumbList matching the visible
  breadcrumbs, CollectionPage on category pages, Organization and WebSite
  (with SearchAction) site-wide.
- **Sitemap** — `/sitemap.xml`, generated live from the database, batched
  1000 rows at a time, excluding anything marked noindex.
- **robots.txt** — `/robots.txt`, blocking admin, cart, checkout, account,
  auth and `?search=`/`?sort=` permutations.
- **Noindex** — cart, checkout, account, wishlist, orders, login, signup,
  password pages, 404. Search and filter URLs are `noindex, follow` with a
  canonical pointing at the clean collection URL.

---

## 6. Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `SITE_URL` | server | Canonical origin for sitemap, robots, redirects |
| `VITE_SITE_URL` | client build | Canonical origin for meta tags and JSON-LD |
| `VITE_API_BASE_URL` | client build | API origin |

Both default to `https://orvida.in` if unset. No domain is hardcoded anywhere
else.

---

## 7. API

Public:

- `GET /sitemap.xml`, `GET /robots.txt`
- `GET /api/seo/redirect?path=/product/old-slug`

Admin (JWT + `is_admin`):

- `GET /api/seo/admin/audit` — health score and counts
- `GET /api/seo/admin/products?missing=title|description|alt|slug`
- `POST /api/seo/admin/bulk` — `{ action: 'alt'|'description'|'slug'|'title' }`
- `GET|POST /api/seo/admin/redirects`, `DELETE /api/seo/admin/redirects/:id`

SEO fields ride along on the existing product and category endpoints rather
than needing separate calls.

---

## 8. Google Search Console

1. Search Console → add property → `https://orvida.in` → **HTML tag** method.
2. Copy the `content` value from the tag it shows.
3. Admin → Site Content → SEO → Google integrations → **Search Console
   verification** → paste → Save.
4. Back in Search Console, click Verify.
5. Sitemaps → submit `sitemap.xml`.

## 9. Analytics

Admin → Site Content → SEO → Google integrations. Enter a GA4 ID
(`G-XXXXXXXXXX`) or GTM ID (`GTM-XXXXXXX`). Left blank, **no tracking script
is loaded at all** — visitors of an unconfigured store download nothing.

---

## 10. Auditing

```bash
cd server && npm run seo:audit
```

Checks slug uniqueness, empty-string vs NULL hygiene, canonical safety,
redirect loops/chains/dangling targets, sitemap and robots health, noindex
exclusion, and 200/404 behaviour. Exits non-zero on failure, so it can gate a
deploy.

---

## 11. Maintenance checklist

**Monthly**

- Admin → SEO: is the health score stable or rising?
- Clear the "needs attention" list for commercially important products.
- Search Console → Coverage: any new errors?

**After a catalogue import**

- Run the three "fill the gaps" actions.
- Run `npm run seo:audit`.
- Confirm the sitemap URL count moved as expected.

**After renaming URLs**

- Check Admin → SEO → Redirects lists the old path.
- Visit the old URL and confirm it lands on the new page.

---

## 12. Known limitation

This is a client-rendered SPA: metadata and JSON-LD are set in the browser.
Google executes JavaScript and indexes these correctly, but simpler crawlers
and some link-preview bots only see the static shell in `client/index.html`
(which carries the homepage title, description, OG tags, Organization schema
and crawlable body content as a floor).

If per-product link previews on social platforms become important, the fix is
prerendering or a Next.js migration — a deliberate project, not a patch. The
database, utilities and admin UI built here would carry over unchanged, since
none of the SEO logic is coupled to the rendering strategy.

---

## 13. SEO landing pages

Standalone pages at a top-level slug (`/rare-indoor-plants`) that target
searches the catalogue cannot reach. Managed under **Admin → SEO Management →
Landing Pages**.

### Data model

`seo_pages` holds content (h1, intro, body, FAQs, CTA), search metadata,
social cards, robots/sitemap flags, schema type, scheduling and authorship.
Repeating structures (FAQs, internal links, breadcrumbs) are JSONB rather than
child tables, because they are only ever read with their page.
`seo_page_templates` holds reusable starting points.

### Statuses and scheduling

- **Draft** — invisible to the public API and the sitemap.
- **Published** — live.
- **Scheduled** — live automatically once `scheduled_at` passes.

Scheduling needs no cron: the public query treats a page as live when
`status = 'published' OR (status = 'scheduled' AND scheduled_at <= NOW())`.
A tidy-up query then promotes due rows so the admin list reads correctly.
That means a scheduled page appears on time even if nothing is running.

### The editor

Five tabs — Content, Search, Social, Links & FAQ, Advanced — with a permanent
right rail showing the live SEO score, warnings, Google preview, social
preview and a checklist. The slug follows the page name until an admin edits
it, and leaving with unsaved changes prompts first.

### SEO score

`client/src/lib/seoScore.js`, weighted across sixteen checks (title and its
length, description and its length, focus keyword and its presence in the
title and H1, content length, H1, image, alt text, internal links, sitemap,
indexability, schema validity). It measures completeness — it does not
predict rankings, and the UI says so.

### Publishing safety

Warnings never block publishing: a published page with no title, a noindex
page, thin content, FAQ schema without questions, or a scheduled page with no
date are all surfaced but permitted.

### URLs and redirects

Renaming a **published** page's slug records a 301 in the existing `redirects`
table, so inbound links keep working; the storefront follows it before
rendering a 404. Draft renames record nothing, since nothing was public.

### Sitemap

Only pages that are live, `include_in_sitemap`, and `robots_index` appear —
carrying their own priority and change frequency.

### Route precedence

The public route is `/:slug`, declared last. React Router ranks static routes
above dynamic ones, so `/cart`, `/about` and every existing page keep winning;
this was verified explicitly.

### Permissions

This application authenticates with a JWT carrying a single `is_admin` claim —
there is no roles/permissions table. Every landing-page route therefore sits
behind `authenticateToken + requireAdmin`, exactly like every other admin
feature. Granular permissions (SEO_VIEW, SEO_PUBLISH, …) would require
introducing an RBAC system, which is a separate piece of work.

---

## 14. Blog

Articles at `/blog` and `/blog/:slug`. Managed under **Admin → Blog**.

### Why a separate table

The blog reuses the landing-page machinery — the same slug and redirect
service, the same scoring library, the same previews, the same sitemap — but
posts carry things a landing page does not: an author, an excerpt, a category,
tags, a reading time, and a listing page that has to sort and filter them.
`blog_posts` (migration §15) holds all of it.

### Statuses and scheduling

Identical to landing pages: **draft** is invisible everywhere, **published**
is live, **scheduled** goes live on its own once `scheduled_at` passes — no
cron involved. A draft is a 404 to the public API, so an unpublished article
cannot be read by guessing its URL.

### The editor

Four tabs — Post, Search, Social, Advanced — with the same right rail
(live score, warnings, Google preview, social preview, checklist). The slug
follows the title until an admin edits it, reading time is recomputed from the
article on every save, and leaving with unsaved changes prompts first.

The score reuses `calculateSeoScore` with the internal-links check excluded,
since posts have no link block; the post title stands in for the H1 and the
excerpt for the intro, because that is what each one renders as.

### Fallbacks

Same chain as everything else — nothing derivable is stored:

```
SEO title       →  post title
Meta description →  excerpt  →  global default
OG/Twitter image →  featured image  →  global default
Author           →  the admin who created the post
```

### Indexing

- Published, indexable posts appear in `/sitemap.xml` with their own priority
  and change frequency; `/blog` itself is a static sitemap entry.
- A post set to “no index” is hidden from the blog index as well as from
  Google — a page nobody should find should not be linked from the site.
- Filtered and paginated index views (`?category=`, `?tag=`, `?search=`,
  `?page=`) are `noindex, follow` and canonicalise to `/blog`, because they
  are the same articles rearranged.
- Every post emits `BlogPosting` structured data with its dates, author and
  publisher; the index emits `Blog`.

### Renaming

Renaming a **published** post records a 301 in the existing `redirects` table,
exactly like products and landing pages, and the storefront follows it before
showing a 404. Draft renames record nothing, since nothing was public.

### Route precedence

`/blog` and `/blog/:slug` are declared above the catch-all `/:slug`, so a
landing page can never take the blog's URLs.

---

## 15. Duplicate listings

The catalogue import created one product row per price variant, so a single
item could occupy two dozen URLs with an identical name and description —
268 of 352 products sat in such a group. Search engines read those as
competing duplicates, pick one arbitrarily, and scatter the ranking signals
the group earned.

```bash
cd server && npm run seo:canonicalise -- --dry-run   # show the groups
cd server && npm run seo:canonicalise                # apply
cd server && npm run seo:canonicalise -- --undo      # reverse
```

Every duplicate's `canonical_url` points at the lowest-priced member of its
group; the keeper carries no override, so the group never chains. Nothing is
deleted — every variant still resolves, shows its own price and is
purchasable. Only the instruction to search engines changes.

The sitemap skips any product that canonicalises elsewhere, since advertising
a page the site itself calls a duplicate contradicts the declaration. `npm run
seo:audit` checks for dangling targets, chains and sitemap leaks.

**Re-run this after any catalogue import.** The right long-term fix is real
product variants — one page with selectable options — which would make the
consolidation unnecessary.

---

## 16. camelCase at the boundary

The API returns snake_case rows; the generators in `client/src/lib/seo.js`
read camelCase. `normalizeProduct` and `normalizeCategory` in
`client/src/services/api.js` bridge the two, mapping every SEO field (and the
subcategories nested inside a category) as the response is parsed.

That is the single place the translation happens. **A generator must only ever
be handed an entity that came through those functions** — a raw row fetched
past them would leave `product.seoTitle` undefined and every override would
silently fall back to its default, with nothing to show that anything was
wrong.

When you add an SEO field, add it to the matching normaliser too, and confirm
the value appears in the rendered `<head>` rather than just in the database.

## 17. Seeding the fields that were never filled

```bash
cd server && npm run seo:seed
```

Writes the global `seo_settings` document, SEO titles/descriptions/alt text
for all categories and subcategories, care copy for the plants that arrived
from the import with no text, shorter titles for names Google would truncate,
and distinct descriptions where the import gave a whole family one shared
paragraph.

Everything is COALESCE-guarded on the existing value, so re-running it after
an admin edit changes nothing. The one exception is the shared-boilerplate
descriptions, which overwrite by design — and only while the text is still
identical to a sibling's. Edit one in the admin panel and the script stops
touching it.

## 18. What the health score measures

Admin → SEO shows a weighted score. It counts what a page will **actually
render**, not whether an admin typed an override:

- A product with good copy of its own needs no `seo_description`; the
  fallback chain is the design, so it is not counted as a gap.
- Titles are measured against the space left once the brand suffix from the
  title template is subtracted — the question is whether Google will truncate
  it, not whether someone filled a field.
- Products that canonicalise elsewhere are excluded entirely. Grading pages
  you have told Google to ignore only manufactures work.

## 19. A bug worth remembering

The categories endpoint selected only `id, name, slug, image, count` for the
subcategories nested in its response. The subcategory SEO columns existed in
the database and were editable in the admin panel, but never left the server,
so `normalizeCategory` mapped `undefined` for all of them and every
subcategory page fell back to its parent's title and description — seventeen
pages competing as four duplicates.

Nothing reported an error; the fallback chain quietly produced something
plausible. **Data that exists, is editable, and never reaches the page is the
failure mode to watch for here** — check the rendered `<head>`, not the
database, when verifying an SEO field works end to end.

---

## 20. Wishlist

Saved products live on the visitor's account once they sign in
(`wishlist_items`), and in `localStorage` before that.

- **Guest** — ids in `localStorage`, resolved against the catalogue by
  `GET /api/products?ids=…`.
- **Sign-in** — `POST /api/wishlist/merge` folds the guest ids into the
  account additively (`ON CONFLICT DO NOTHING`), so a list built before
  logging in survives and a second device adds to the list rather than
  replacing it. The local copy is then cleared, or signing out would
  resurrect items removed while signed in.
- **Signed in** — `POST /api/wishlist/toggle` per change, applied
  optimistically and rolled back if the server refuses.

The `/wishlist` page fetches exactly the saved products. It previously
requested the first 200 of the catalogue and filtered locally, so anything
saved from beyond that page vanished from the wishlist while the header still
counted it — with 352 products, 152 of them were unreachable.
