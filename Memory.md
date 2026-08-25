# Memory — Nanobox

This file is the fast-onboarding snapshot for contributors and AI agents.
It tells you what exists, what works, what is broken, and what comes next —
so you do not have to read the entire codebase to get started.

**Last updated:** 2026-08-25 · Milestones 1–7 complete, Milestone 8 in progress.

---

## What Has Been Built (Complete)

### Phase 1 — Foundation
- Tauri 2 + React 19 + TypeScript project, full folder structure
- Borderless, transparent, always-on-bottom overlay window (sits above wallpaper, below open apps)
- System tray icon (show/hide/quit); launch on login (autostart)
- SQLite via `tauri-plugin-sql`; all data in a single DB; migrations numbered in `src-tauri/src/lib.rs`
- GitHub Actions CI: Windows + macOS build matrix on every push to `main`

### Phase 2 — Core Widgets
Notes, Alarm, App Shortcuts (drag-in app icons), Countdown timer, Habit Tracker,
Focus Mode (Pomodoro), widget grid with 8px snapping and resize handles.

### Phase 3 — Theme Engine
17 themes (see `Design.md` for full token values). All use CSS custom properties
(`--nb-surface`, `--nb-accent`, `--nb-radius`, etc.) defined in `src/themes/`.
Theme switching is instant — set `document.documentElement.dataset.theme`.
Per-theme accent/radius/font-scale customisation saved to SQLite.
Colourblind palette toggle (Okabe-Ito blue #0072B2) in `src/core/colorblindPalette.ts`.

### Phase 4 — ADHD Toolkit Widgets
Visual Timer (shrinking disk), Today Timeline (time blocks), Brain Dump (quick capture),
Task Breakdown (checklist with header task), Mood Check-in (emoji + 7-day history),
Gentle Reminders (interval-based nudges).
Custom Widget (sandboxed iframe) added in this phase as an early precursor to the block builder.

### Phase 5 — Integrations
- **Music widget:** Spotify OAuth PKCE (implemented, unverified against real account);
  OS media session (Windows SMTC) for any playing audio.
  Apple Music and YouTube Music stubs exist but are blocked (see `src/integrations/music/`).
- **Calendar widget:** Google Calendar OAuth PKCE + local `.ics` parsing.
  OAuth compiled clean but unverified against a real account.
- **Keychain:** OS-native secret storage via `keyring` Rust crate.

### Phase 6 — Window Chrome & UX
Real minimize/maximize/hide-to-tray controls. Working drag via `startDragging()` API.
Taskbar presence (`skipTaskbar` cleared). Per-widget colour and border-style settings.

### Phase 7 — Block Builder (Lego Engine)
React Flow visual canvas to drag-and-wire logic blocks (22+ block types).
Custom block creator with JS body editor (sandboxed `new Function`).
Programs saved to SQLite (`block_programs`, migration v9).
Custom block defs in `custom_block_defs` (migration v10).
Export/import as `.nanowidget` JSON files.
`block-widget` widget type runs a saved program live on a configurable interval.

---

## What Is Being Worked On

**Phase 8 — Polish & Release** (current)

- P0 auth gaps (see Known Issues below)
- Onboarding wizard (first-run: theme picker, accent, add first widget)
- Full keyboard navigation
- Code signing (Windows NSIS, macOS DMG)
- Auto-update (`tauri-plugin-updater`)
- Docs site and public release

---

## What Is Left To Do

### Phase 8 checklist

- [ ] Fix `DEFAULT_SPOTIFY_CLIENT_ID = ""` — needs bundled or user-entered client ID
- [ ] Google Calendar: add in-app guidance for supplying client_id
- [ ] CustomWidget sandbox: block outbound `fetch()` or add a capability declaration
- [ ] Onboarding wizard
- [ ] Keyboard navigation pass
- [ ] Windows code signing (EV/OV certificate or sponsored signing)
- [ ] macOS code signing + notarization (Apple Developer account required)
- [ ] Wire up `tauri-plugin-updater` for auto-update
- [ ] `winget install Nanobox` submission
- [ ] `brew install --cask nanobox` submission
- [ ] Docs site
- [ ] README demo GIF

### Deferred / stretch

- [ ] Companion widget (cosmetic plant from Habit Tracker streak data)
- [ ] Apple Music integration (blocked: needs private-key JWT from Apple Developer account)
- [ ] YouTube Music integration (blocked: no official "now playing" API)
- [ ] Block engine: true isolation (Web Worker or iframe sandbox — current `new Function` does not block `fetch`)
- [ ] Block engine: execution timeout
- [ ] Linux support (currently excluded; `sync-secret-service` removed from Cargo.toml)
- [ ] macOS hands-on testing (builds in CI but never run on real hardware)
- [ ] Real-world OAuth verification (Spotify and Google Calendar implemented but never tested against real accounts)

---

## Known Issues (Priority Order)

| # | Priority | Issue |
|---|---|---|
| 1 | P0 | `DEFAULT_SPOTIFY_CLIENT_ID = ""` — music auth silently fails |
| 2 | P0 | Google Calendar needs user-supplied client_id; no in-app guidance |
| 3 | P0 | CustomWidget sandbox (`allow-scripts`) does not block outbound `fetch()` |
| 4 | P1 | Silent DB failures show blank widgets — no user-visible error states |
| 5 | P1 | Block engine custom JS: no execution timeout, no true process isolation |
| 6 | P2 | macOS overlay window behaviour untested (tray, always-on-bottom, drag) |
| 7 | P2 | OAuth token refresh and revoke paths untested |
| 8 | P2 | Window dragging fix (`startDragging()`) compiled and type-checked but not confirmed by a human dragging the window |
| 9 | P3 | No keyboard navigation across widgets and settings |
| 10 | P3 | No first-run onboarding (user lands on a blank canvas) |

---

## Key Files to Know

| File | What it does |
|---|---|
| `src/App.tsx` | Root component: canvas, settings panel, block builder modal |
| `src/main.tsx` | React entry; pre-warms SQLite before mount |
| `src/storage/db.ts` | SQLite singleton; all migrations run here — add new migrations here |
| `src/widgets/registry.ts` | `WidgetId` type + `DEFAULT_SIZE` map — register new widgets here |
| `src/themes/base.css` | All `--nb-*` token fallback values |
| `src/themes/themes.ts` | `ThemeId` union type + `THEMES` metadata map |
| `src/core/colorblindPalette.ts` | Okabe-Ito palette toggle |
| `src/integrations/blockEngine/types.ts` | Block engine AST types |
| `src/integrations/blockEngine/evaluator.ts` | Block program evaluator |
| `src/integrations/music/spotify.ts` | Spotify OAuth + playback API |
| `src/integrations/calendar/googleCalendar.ts` | Google Calendar OAuth |
| `src-tauri/src/lib.rs` | Tauri app bootstrap + all DB migrations |
| `src-tauri/Cargo.toml` | Rust deps + build profiles (release: strip, lto, opt-z) |
| `src-tauri/tauri.conf.json` | Window config, bundle targets, CSP |

---

## How to Run

```bash
git clone https://github.com/AShah-01/Nanobox.git
cd Nanobox
npm install
npm run tauri dev
```

Prerequisites: Node 20+, Rust stable, Windows C++ Build Tools + WebView2 (Windows)
or Xcode Command Line Tools (macOS). See `README.md` for the guided setup.

## How to Build a Release

```bash
npm run tauri build
```

Produces an NSIS installer (Windows) or DMG (macOS) in `src-tauri/target/release/bundle/`.

## Disk Space Note

`src-tauri/target/` is the Rust compilation cache and can grow to 15+ GB in dev.
Run `cargo xtrim` (from `src-tauri/`) or `cargo clean` to wipe it. Dev builds use
`debug = 1` (line tables only) to keep the cache smaller. CI uses the release profile
(`strip = true`, `lto = "thin"`, `opt-level = "z"`).

---

## Docs

- `PRD.md` — what to build and why
- `Architecture.md` — app flow, folder structure, tech stack
- `Rules.md` — coding rules, library choices, AI agent boundaries
- `Phases.md` — milestone-by-milestone plan (this replaced ROADMAP.md + PLAN.md)
- `Design.md` — all 17 themes with full CSS token values
- `Memory.md` — this file (contributor onboarding snapshot)
- `docs/WIDGETS.md` — widget reference
- `docs/BLOCK_ENGINE.md` — block engine internals
