#!/usr/bin/env bash
# One-line installer: downloads the latest release zip from GitHub and installs it.
#
#   curl -fsSL https://raw.githubusercontent.com/AMitchell-GitHub/gnome-claude-monitor/main/online-install.sh | bash
#
set -euo pipefail

OWNER="AMitchell-GitHub"
REPO="gnome-claude-monitor"
UUID="claude-usage@aidan.local"
ASSET="claude-usage.shell-extension.zip"
URL="https://github.com/${OWNER}/${REPO}/releases/latest/download/${ASSET}"

command -v gnome-extensions >/dev/null || {
    echo "error: 'gnome-extensions' not found — are you on GNOME Shell?" >&2
    exit 1
}

echo "Downloading latest release..."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fsSL "$URL" -o "$TMP/$ASSET"

echo "Installing $UUID..."
gnome-extensions install --force "$TMP/$ASSET"
gnome-extensions enable "$UUID" 2>/dev/null || true

cat <<EOF

✓ Installed.

Last step — reload GNOME Shell so it loads:
  X11:     press Alt+F2, type 'r', press Enter
  Wayland: log out and back in

Then, if it isn't on yet:   gnome-extensions enable $UUID
Change where it sits:       gnome-extensions prefs $UUID
EOF
