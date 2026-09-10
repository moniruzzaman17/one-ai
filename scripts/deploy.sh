#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="/home/greenmin/repositories/one-ai"
APP_LINK="/home/greenmin/oneai-app"
RELEASE_ROOT="/home/greenmin/oneai-releases"
DATA_ROOT="/home/greenmin/oneai-data"
DOC_ROOT="${ONEAI_DOCUMENT_ROOT:-}"
STAMP="$(date +%Y%m%d-%H%M%S)"

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

mkdir -p "$RELEASE_DIR" "$DATA_ROOT/uploads" "$DATA_ROOT/recordings" "$DATA_ROOT/backups"
cp -a .next/standalone/. "$RELEASE_DIR/"

if [[ -n "$DOC_ROOT" && -d "$DOC_ROOT" && ! -e "$DATA_ROOT/backups/document-root-$STAMP" ]]; then
  cp -a "$DOC_ROOT" "$DATA_ROOT/backups/document-root-$STAMP"
fi

if [[ -L "$APP_LINK" ]]; then
  readlink "$APP_LINK" > "$DATA_ROOT/previous-release"
elif [[ -d "$APP_LINK" ]]; then
  mv "$APP_LINK" "$DATA_ROOT/backups/oneai-app-$STAMP"
fi
ln -sfn "$RELEASE_DIR" "$APP_LINK"
mkdir -p "$APP_LINK/tmp"
touch "$APP_LINK/tmp/restart.txt"

for attempt in {1..12}; do
  if curl --fail --silent --show-error "https://one.greenminds.info/api/health" | grep -q '"status":"ok"'; then
    echo "OneAI v$VERSION deployed successfully"
    exit 0
  fi
  sleep 5
done

if [[ -f "$DATA_ROOT/previous-release" ]]; then
  ln -sfn "$(cat "$DATA_ROOT/previous-release")" "$APP_LINK"
  touch "$APP_LINK/tmp/restart.txt"
fi
echo "Health check failed; previous release restored" >&2
exit 1
