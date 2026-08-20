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
