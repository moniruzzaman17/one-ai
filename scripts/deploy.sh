#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="/home/greenmin/repositories/one-ai"
APP_ROOT="/home/greenmin/oneai-app"
CURRENT_LINK="$APP_ROOT/current"
RELEASE_ROOT="/home/greenmin/oneai-releases"
DATA_ROOT="/home/greenmin/oneai-data"
DOC_ROOT="${ONEAI_DOCUMENT_ROOT:-}"
STAMP="$(date +%Y%m%d-%H%M%S)"
MODE="${1:-deploy}"

cd "$REPO_DIR"
VERSION="$(node -p "require('./package.json').version")"
RELEASE_DIR="$RELEASE_ROOT/v$VERSION-$STAMP"
git checkout master
git pull --ff-only origin master
npm ci
npm run typecheck
npm test
npm run db:migrate
npm run db:seed
npm run build
npm run deploy:prepare

mkdir -p "$RELEASE_DIR" "$APP_ROOT/tmp" "$DATA_ROOT/uploads" "$DATA_ROOT/recordings" "$DATA_ROOT/backups"
cp -a .next/standalone/. "$RELEASE_DIR/"
cp "$REPO_DIR/scripts/cpanel-server.js" "$APP_ROOT/server.js"
chmod 700 "$DATA_ROOT" "$DATA_ROOT/uploads" "$DATA_ROOT/recordings" "$DATA_ROOT/backups"

if [[ -n "$DOC_ROOT" && -d "$DOC_ROOT" && ! -e "$DATA_ROOT/backups/document-root-$STAMP" ]]; then
  cp -a "$DOC_ROOT" "$DATA_ROOT/backups/document-root-$STAMP"
fi

PREVIOUS_RELEASE=""
if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS_RELEASE="$(readlink "$CURRENT_LINK")"
fi
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
touch "$APP_ROOT/tmp/restart.txt"

if [[ "$MODE" == "--prepare" ]]; then
  echo "OneAI v$VERSION prepared at $APP_ROOT; create/restart the cPanel Node.js application now"
  exit 0
fi

for attempt in {1..12}; do
  if curl --fail --silent --show-error "https://one.greenminds.info/api/health" | grep -q '"status":"ok"'; then
    echo "OneAI v$VERSION deployed successfully"
    exit 0
  fi
  sleep 5
done

if [[ -n "$PREVIOUS_RELEASE" && -d "$PREVIOUS_RELEASE" ]]; then
  ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
  touch "$APP_ROOT/tmp/restart.txt"
fi
echo "Health check failed; previous release restored" >&2
exit 1
