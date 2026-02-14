#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "$ROOT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
fi

APP_NAME="${APP_NAME:-Werd}"
SIGN_IDENTITY="${SIGN_IDENTITY:-}"
GITHUB_REPO="${GITHUB_REPO:-}"
APPLE_ID="${APPLE_ID:-}"
APPLE_TEAM_ID="${TEAM_ID:-}"
APPLE_APP_SPECIFIC_PASSWORD="${NOTARY_PASSWORD:-}"
SKIP_NOTARIZE="${SKIP_NOTARIZE:-0}"

if [[ -z "$SIGN_IDENTITY" ]]; then
  echo "SIGN_IDENTITY is required (e.g. 'Developer ID Application: Your Name (TEAMID)')." >&2
  exit 1
fi

if [[ -z "$GITHUB_REPO" ]]; then
  echo "GITHUB_REPO is required (e.g. 'kluzzebass/werd')." >&2
  exit 1
fi

cd "$ROOT_DIR"

echo "Installing dependencies..."
bun install

echo "Building app..."
bun run build

echo "Packaging, signing, and notarizing app..."
# Set environment variables for electron-builder signing and notarization
# Strip "Developer ID Application: " prefix if present - electron-builder adds it automatically
CSC_NAME_CLEAN="${SIGN_IDENTITY#Developer ID Application: }"
export CSC_NAME="$CSC_NAME_CLEAN"

if [[ "$SKIP_NOTARIZE" != "1" && -n "$APPLE_ID" && -n "$APPLE_TEAM_ID" && -n "$APPLE_APP_SPECIFIC_PASSWORD" ]]; then
  export APPLE_ID
  export APPLE_TEAM_ID
  export APPLE_APP_SPECIFIC_PASSWORD
  echo "Notarization enabled"
else
  export CSC_IDENTITY_AUTO_DISCOVERY=false
  echo "Notarization disabled"
fi

bunx electron-builder --publish never

# Get version from package.json
VERSION="$(node -p "require('./package.json').version")"

DIST_DIR="$ROOT_DIR/dist"

# The zip file is named by electron-builder using artifactName pattern
ZIP_NAME="${APP_NAME}-${VERSION}.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Built zip not found at $ZIP_PATH" >&2
  echo "Available files:"
  ls -la "$DIST_DIR"/*.zip 2>/dev/null || echo "No zip files found"
  exit 1
fi

SHA256="$(shasum -a 256 "$ZIP_PATH" | awk '{print $1}')"

echo ""
echo "Release artifacts:"
echo "  Zip: $ZIP_PATH"
echo "  Version: $VERSION"
echo "  SHA256: $SHA256"
echo ""

cat > "$DIST_DIR/cask.rb" <<EOF
cask "werd" do
  version "$VERSION"
  sha256 "$SHA256"

  url "https://github.com/$GITHUB_REPO/releases/download/v#{version}/$ZIP_NAME"
  name "Werd"
  desc "The One-Word Word Processor"
  homepage "https://github.com/$GITHUB_REPO"

  app "${APP_NAME}.app"
end
EOF

echo "Cask snippet written to $DIST_DIR/cask.rb"
