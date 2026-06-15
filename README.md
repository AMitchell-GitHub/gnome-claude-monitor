# Claude Usage — GNOME Shell extension

A top-bar indicator for **GNOME Shell 48** that shows your live **Claude Code** sessions and
your **usage** against Claude's rolling limits, with a dropdown for detail.

> Panel: `🤖 1/3 │ ⏱ 13% · 4h13m`
> &nbsp;&nbsp;• robot + `running/total` sessions (count turns orange when one is working)
> &nbsp;&nbsp;• speedometer + real 5-hour utilization and reset countdown

## Install

### Option A — one-liner (recommended)

Downloads the latest release and installs it:

```sh
curl -fsSL https://raw.githubusercontent.com/AMitchell-GitHub/gnome-claude-monitor/main/online-install.sh | bash
```

Then reload GNOME Shell: **X11** → `Alt`+`F2`, type `r`, `Enter`. **Wayland** → log out/in.

### Option B — download a release

1. Grab `claude-usage.shell-extension.zip` from the [latest release](https://github.com/AMitchell-GitHub/gnome-claude-monitor/releases/latest).
2. `gnome-extensions install --force claude-usage.shell-extension.zip`
3. Reload the shell (above), then `gnome-extensions enable claude-usage@aidan.local`.

### Option C — from source

```sh
git clone https://github.com/AMitchell-GitHub/gnome-claude-monitor.git
cd gnome-claude-monitor
./install.sh        # copies into place + compiles the schema + enables
```

Open settings any time: `gnome-extensions prefs claude-usage@aidan.local`.

## What it shows

**Dropdown:**
- **Sessions** — one row per live session: project name, status dot (busy/idle), uptime
- **Usage** — 5h window (% bar + reset countdown), weekly window (% + reset + any
  model-specific opus/sonnet limits), plan tier, today's tokens
- **Status line** — `Updated 12s ago · source: api`, or in red `⚠ Pull failed: HTTP 429`
- **Refresh now**

**Preferences:** choose the top-bar **section** (left / center / right) and **position**
within it — changes apply live.

## How it works

| Shown | Source |
|-------|--------|
| Sessions + busy/idle status | `~/.claude/sessions/*.json` (filtered to live PIDs via `/proc`) — local |
| 5h + weekly usage % and reset | `GET https://api.anthropic.com/api/oauth/usage` — the same endpoint Claude Code's `/usage` and claude.ai/settings/usage use |
| Plan tier | `~/.claude.json` (`oauthAccount`) — local |
| Today's tokens | `~/.claude/projects/*/*.jsonl` — local |

The usage call uses your existing local OAuth token from `~/.claude/.credentials.json` as a
Bearer token to read **your own** usage. The token is read locally and sent only to
`api.anthropic.com` — never stored, logged, or sent anywhere else. The API is polled about
once a minute; the countdown ticks locally in between. If the API is unreachable, the
extension falls back to a local estimate from transcripts (marked `*`/`~`) and the dropdown
status line shows the error.

## Requirements

- GNOME Shell **48** (X11 or Wayland)
- [Claude Code](https://claude.com/claude-code) installed and signed in (the extension reads its local files)

## Build / release (maintainers)

Build a distributable zip locally (needs `libglib2.0-bin` + `zip`):

```sh
./build.sh          # → dist/claude-usage.shell-extension.zip
```

Releases are automated: pushing a `v*` tag triggers `.github/workflows/release.yml`, which
builds the zip and attaches it to a GitHub Release (so the one-liner always grabs the newest):

```sh
git tag v1.0.0
git push origin v1.0.0
```

## Layout

```
claude-usage@aidan.local/   the extension
  metadata.json             uuid, shell-version, settings-schema
  extension.js              enable()/disable(), panel placement
  dataService.js            file I/O, usage API (libsoup), refresh engine
  blocks.js                 pure 5h-window math (unit-tested)
  indicator.js              panel button + dropdown UI
  prefs.js                  preferences (libadwaita)
  stylesheet.css            colours
  schemas/                  GSettings schema
  icons/                    robot + speedometer SVGs
build.sh                    build the release zip
install.sh                  install from source
online-install.sh           one-liner installer (downloads latest release)
test/blocks-test.js         `gjs -m test/blocks-test.js`
```

## License

[MIT](LICENSE)
