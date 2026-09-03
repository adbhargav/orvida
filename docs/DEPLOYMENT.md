# Deploying the ORIVIDA API to a VPS

The backend runs on the VPS at **`api.orvida.in`**. The storefront stays on
Vercel at `orvida.in` and talks to it over HTTPS.

```
browser ──► orvida.in (Vercel, static build)
              │
              └─ fetch ──► api.orvida.in (nginx :443 ─► node :5001) ──► Postgres
```

nginx also fronts `/sitemap.xml` and `/robots.txt`, which Vercel rewrites to
the API so crawlers see them on your own domain.

---

## 1. Before you start

You need:

- A VPS with Ubuntu 22.04 or 24.04, root or sudo.
- **Node 20 or newer.** The code uses `??=`, top-level `await` in scripts and
  native `fetch`.
- A Postgres database. Either keep the managed Neon one you already use — no
  migration needed, it is the same database — or run Postgres on the VPS.
- An **A record** for `api.orvida.in` pointing at the VPS IP. Set this up
  first; certbot cannot issue a certificate until it resolves.

---

## 2. One-time server setup

```bash
# a system user that owns the app and nothing else
sudo adduser --system --group --home /var/www/orvida orvida
sudo mkdir -p /var/www/orvida /var/log/orvida /var/www/orvida/secrets
sudo chown -R orvida:orvida /var/www/orvida /var/log/orvida
sudo chmod 700 /var/www/orvida/secrets

# Node 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# only 80/443 and ssh reach the outside; the API port stays internal
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

Then clone and configure:

```bash
sudo -u orvida git clone <repo-url> /var/www/orvida
cd /var/www/orvida
sudo -u orvida npm --prefix server ci --omit=dev

sudo -u orvida cp server/.env.production.example server/.env
sudo -u orvida chmod 600 server/.env
sudo -u orvida nano server/.env      # fill it in — see §3
```

Put the Firebase service-account JSON at
`/var/www/orvida/secrets/firebase-service-account.json` (`chmod 600`) and
point `FIREBASE_SERVICE_ACCOUNT_PATH` at it. On a VPS a real file is cleaner
than the base64 env var that hosted platforms force you into.

---

## 3. Environment

`server/.env.production.example` is the annotated template. The four that will
bite you if wrong:

| Variable | Value | Why |
|---|---|---|
| `JWT_SECRET` | 48+ random bytes | **The server refuses to boot in production without it.** Changing it later signs every existing session out. |
| `CLIENT_URL` | `https://orvida.in` | The API rejects any browser origin not listed here or in `ADDITIONAL_ORIGINS`. Get it wrong and every request from the storefront fails CORS. |
| `PUBLIC_ASSET_URL` | `https://api.orvida.in` | Every uploaded-image URL is built from this. A localhost or `http://` value produces mixed-content images that browsers block. |
| `DELHIVERY_PICKUP_NAME` | exactly as registered | Case-sensitive. A mismatch fails with *"ClientWarehouse matching query does not exist"*. |

---

## 4. nginx and TLS

```bash
sudo cp deploy/nginx/api.orvida.in.conf /etc/nginx/sites-available/api.orvida.in
sudo ln -s /etc/nginx/sites-available/api.orvida.in /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.orvida.in
```

certbot rewrites the config to add the TLS block and a redirect from `:80`,
and installs a renewal timer. Confirm with `sudo certbot renew --dry-run`.

The proxy config matters more than it looks:

- `X-Forwarded-Proto` is what makes `req.protocol` report `https`. `server.js`
  sets `trust proxy`, so without this header every generated asset URL comes
  out `http://` and the storefront blocks it.
- `client_max_body_size 12m` — nginx's 1 MB default would reject a product
  photograph.
- The Razorpay webhook location disables request buffering, because the
  signature is an HMAC over the exact bytes sent.

---

## 5. Running it

**PM2** (recommended — clusters across cores, reloads without dropping
requests):

```bash
sudo npm install -g pm2
cd /var/www/orvida
sudo -u orvida pm2 start server/ecosystem.config.cjs --env production
sudo -u orvida pm2 save
sudo pm2 startup systemd -u orvida --hp /var/www/orvida
```

**systemd** instead, if you would rather not add a process manager:

```bash
sudo cp deploy/orvida-api.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now orvida-api
```

Use one or the other, never both — they will fight over the port.

Verify:

```bash
curl -s https://api.orvida.in/api/health
curl -sI https://api.orvida.in/sitemap.xml | head -3
```

---

## 6. Migrating from Render

The database is unchanged — only the host the API answers on moves.

**1. Repoint stored image URLs.** Uploaded images live in Postgres but are
referenced by absolute URL, so anything still naming the old host breaks the
moment it stops serving:

```bash
npm --prefix server run db:rewrite-urls -- \
  https://orvida.onrender.com https://api.orvida.in --dry-run
npm --prefix server run db:rewrite-urls -- \
  https://orvida.onrender.com https://api.orvida.in
```

**2. Rebuild the storefront.** `client/.env.production` and both
`vercel.json` files already point at `api.orvida.in`; Vercel picks that up on
the next deploy of `main`.

**3. Move the Razorpay webhook** in the dashboard to
`https://api.orvida.in/api/payments/webhook/razorpay`, keeping the same
signing secret.

**4. Update the Firebase reset-email action URL** to
`https://orvida.in/reset-password`.

**5. Keep Render running** until the new host has served real traffic, then
delete the service. Do not delete it first — the old image URLs are live until
step 1 is applied and Vercel has rebuilt.

---

## 6b. Seeding a fresh database

If the server runs its own Postgres rather than the managed one, bring it up
from the committed snapshot — no access to the old database required:

```bash
npm --prefix server run db:seed-catalogue
```

That applies `schema.sql`, then `migrations.sql`, then `catalogue.sql`, and
realigns every sequence. It reports what landed:

```
352 products · 352 images · 4 categories · 17 subcategories · 2 banners · 6 uploaded files
```

`catalogue.sql` is a committed snapshot of store content — products, images
(the uploaded file bytes included), categories, banners, site content and SEO
templates. It holds **no customers, orders or carts**, so it is safe to keep
in the repository and safe to re-run.

It refuses to run against a database that already has orders, unless you pass
`--force`, because it replaces the catalogue wholesale.

No admin account is created. Make one:

```bash
npm --prefix server run admin:password -- you@example.com
```

**Do not use `npm run db:init`.** That is the original prototype seed — 24
placeholder products with stock photography — and it truncates the banners
table. It is kept only for scratch local databases.

**Refreshing the snapshot.** After changing the catalogue through the admin
panel, re-export from the database that has the changes and commit the result:

```bash
npm --prefix server run db:export
```

---

## 7. Going live

```bash
# see what would be removed, then remove it
npm --prefix server run db:clean-demo -- --dry-run
npm --prefix server run db:clean-demo

# make sure you can still sign in
npm --prefix server run admin:password -- admin@orvida.in
```

`db:clean-demo` deletes test orders, test accounts, sample coupons, the
scratch landing page and stray carts. It never touches the catalogue,
categories, banners, uploaded images, site content or SEO templates, and it
**refuses to run if no admin account would remain**.

Then check the SEO state:

```bash
npm --prefix server run seo:audit
```

---

## 8. Routine deploys

```bash
sudo -u orvida /var/www/orvida/deploy/deploy.sh
```

Fetches `main`, installs, migrates, reloads, and polls `/api/health` until the
app answers — exiting non-zero if it does not. It refuses to run over
uncommitted changes on the server and never touches `.env`.

---

## 9. Backups

The catalogue, orders **and every uploaded image** are all in Postgres, so one
dump is a complete backup:

```bash
# nightly at 02:30
30 2 * * * pg_dump "$DATABASE_URL" | gzip > /var/backups/orvida-$(date +\%F).sql.gz
```

Managed Neon takes its own snapshots; a local Postgres on the VPS does not, so
set this up on day one and copy the dumps off the box.

---

## 10. Uploads stay in Postgres

Uploaded images are stored as `BYTEA` in the `uploads` table and served by
`GET /uploads/:filename`, not from disk. That was forced by Render's
ephemeral filesystem, which destroyed every upload on each deploy.

A VPS has a real disk, so this could be reverted — **don't**. Keeping them in
Postgres means one backup covers everything, a rebuilt server needs nothing
restored, and nginx caches them for 30 days so the database is barely touched.
The cost is a few MB in the database.

---

## 11. Troubleshooting

| Symptom | Cause |
|---|---|
| Storefront requests fail CORS | The origin is not in `CLIENT_URL` / `ADDITIONAL_ORIGINS`. Restart after editing `.env` — it is read at boot. |
| Images broken, console says mixed content | `PUBLIC_ASSET_URL` is `http://` or localhost, or nginx is not sending `X-Forwarded-Proto`. |
| Server exits immediately on boot | `JWT_SECRET` is missing with `NODE_ENV=production`. Deliberate — a default secret would let anyone forge sessions. |
| Google Sign-In rejected | The Firebase service account is not readable. Check the path and that it is owned by `orvida`. |
| Razorpay webhooks fail signature | Something buffered or rewrote the body, or the secret does not match the dashboard. |
| 502 from nginx | Node is not listening. `pm2 logs orvida-api` or `journalctl -u orvida-api -n 100`. |

```bash
pm2 logs orvida-api --lines 100
sudo tail -f /var/log/nginx/orvida-api.error.log
curl -s https://api.orvida.in/api/health
```
