#!/usr/bin/env bash
#
# Pull, install, migrate, reload — run on the VPS as the orvida user.
#
#   cd /var/www/orvida && ./deploy/deploy.sh
#
# Safe to re-run. It stops at the first failure rather than leaving the app
# half-updated, and it never touches .env.

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/orvida}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

echo "==> Fetching $BRANCH"
git fetch --quiet origin "$BRANCH"

# Refuse to clobber work done directly on the server.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "    Uncommitted changes in $APP_DIR. Commit or stash them first." >&2
  exit 1
fi

BEFORE="$(git rev-parse HEAD)"
git reset --hard --quiet "origin/$BRANCH"
AFTER="$(git rev-parse HEAD)"

if [ "$BEFORE" = "$AFTER" ]; then
  echo "    Already at $(git rev-parse --short HEAD) — nothing new."
else
  echo "    $(git rev-parse --short "$BEFORE") -> $(git rev-parse --short "$AFTER")"
fi

echo "==> Installing dependencies"
# npm ci needs a lockfile and installs exactly what it pins; fall back for a
# checkout that has not committed one.
if [ -f server/package-lock.json ]; then
  npm --prefix server ci --omit=dev
else
  npm --prefix server install --omit=dev
fi

echo "==> Applying migrations"
# Additive and idempotent — running it when nothing changed is a no-op.
npm --prefix server run db:migrate

echo "==> Reloading the API"
if command -v pm2 >/dev/null 2>&1 && pm2 describe orvida-api >/dev/null 2>&1; then
  # Reload, not restart: workers cycle one at a time so no request is dropped.
  pm2 reload orvida-api --update-env
elif systemctl is-enabled --quiet orvida-api 2>/dev/null; then
  sudo systemctl restart orvida-api
else
  echo "    No orvida-api process found under pm2 or systemd." >&2
  echo "    Start it once with: pm2 start server/ecosystem.config.cjs --env production" >&2
  exit 1
fi

echo "==> Health check"
for attempt in $(seq 1 10); do
  if curl -fsS --max-time 5 http://127.0.0.1:"${PORT:-5001}"/api/health >/dev/null; then
    echo "    healthy"
    echo
    echo "Deployed $(git rev-parse --short HEAD)."
    exit 0
  fi
  sleep 2
done

echo "    API did not come back healthy. Check the logs:" >&2
echo "      pm2 logs orvida-api --lines 100" >&2
echo "      journalctl -u orvida-api -n 100" >&2
exit 1
