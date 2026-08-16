# Nanobox — Progress

## Session 1 — 2026-08-16 — Foundation scaffold [CEO-approved]

**Milestone 1, tasks 1–4 (see [ROADMAP.md](ROADMAP.md)): done. CI confirms clean builds on both Windows and macOS ([run 31942683609](https://github.com/AShah-01/Nanobox/actions/runs/31942683609)) — clear to start Milestone 2.**

### What was built

- **Repo setup**: GitHub repo initialised (`AShah-01/Nanobox`), `.gitignore`
  (excludes `TaskFiles/`, `node_modules`, `target`, DB files, env files),
  `README.md`, `PLAN.md`, `LICENSE.md` (MIT), `SECURITY.md`. `ROADMAP.md` and
  this file didn't exist yet in the planning docs, so both were created from
  scratch — `ROADMAP.md` translates the original `BACKLOG.md` phase plan onto
  the Tauri 2 stack that `PRODUCT_SPEC.md` actually specifies (the older
  `README.md`/`BACKLOG.md` in `TaskFiles/` describe an Electron+Python stack
  under the name "NeuroNest" — that's a stale earlier iteration; `PRODUCT_SPEC.md`
  is the current source of truth and this scaffold follows it).
- **Toolchain**: installed Rust (via rustup) and the MSVC C++ Build Tools
  (Desktop development with C++ workload) — neither was present on this
  machine and both are required to compile Tauri's Rust side on Windows.
- **Scaffold**: `npm create tauri-app` with the `react-ts` template, then
  restructured to match the folder layout in `PRODUCT_SPEC.md`:
  `src/core`, `src/widgets/{built-in,sandbox}`, `src/themes`, `src/tokens`,
  `src/components`, `src/integrations/{music,calendar}`, `src/storage`,
  `tests/{core,widgets,integrations}`, `public/fonts`.
- **App shell** (`src-tauri/src/lib.rs`):
  - System tray icon with a "Show / Hide Nanobox" menu item and Quit; clicking
    the tray icon also toggles the overlay.
  - Overlay window (`tauri.conf.json`): borderless, transparent, non-resizable,
    skips the taskbar, `alwaysOnBottom: true`. Closing it hides it instead of
    exiting — the tray is the real quit path.
  - Autostart on login via `tauri-plugin-autostart` (Windows registry Run key /
    macOS launchd agent under the hood), enabled once on first launch from
    `src/core/autostart.ts`.
- **Storage**: `tauri-plugin-sql` wired up with a Rust-side migration
  (`src-tauri/src/lib.rs`) that creates an empty `notes` table in
  `sqlite:nanobox.db`. Frontend connector in `src/storage/db.ts`, typed
  `Note` shape and a `listNotes()` read helper in `src/storage/notes.ts`
  (create/update/delete land with the Notes widget in Milestone 2).
- **Clock widget**: `src/widgets/built-in/Clock` — digital, ticking every
  second, rendered inside a shared `WidgetFrame` component
  (`src/components/WidgetFrame.tsx`). This is the one hardcoded widget the
  overlay renders right now; `src/widgets/registry.ts` is the seam Milestone 2
  will use to make widgets pluggable and persisted.
- **Base styling**: `src/themes/base.css` defines the `--nb-*` CSS custom
  property set (surface, text, accent, radius, border, font) that the real
  theme engine (Milestone 3) will override per-theme. `src/tokens/tokens.json`
  mirrors the same values as the seed for the future token→CSS pipeline.
- **Tests**: added `vitest` + `@testing-library/react` (not previously
  configured) and one smoke test (`tests/widgets/Clock.test.tsx`) rendering
  the Clock widget at a fixed time and asserting the displayed time/date.
  `npm run test` runs it.
- **CI**: `.github/workflows/build.yml` — GitHub Actions matrix over
  `windows-latest` and `macos-latest`, each running type-check + a debug
  Tauri build. This is how macOS gets verified, since development is
  happening on Windows only.

### Build verification

- `npx tsc --noEmit` — clean.
- `cargo check` — clean.
- `npm run tauri build -- --debug` — **succeeded** on Windows: produced
  `nanobox.exe`, an MSI installer, and an NSIS installer under
  `src-tauri/target/debug/bundle/`.
- `npm run test` — 1/1 passing.
- macOS build: not run locally (no Mac available in this environment) — the
  `macos-latest` CI job compiled and bundled the app successfully
  (3m36s), confirming Milestone 1 builds cleanly on both target platforms.

### Known gaps / deliberately deferred

- The overlay currently uses `alwaysOnBottom` + no decorations to approximate
  "sits above the wallpaper, below other windows." True desktop-level
  embedding (reparenting into the `WorkerW`/desktop layer the way Rainmeter
  does) is a deeper native-Windows integration that isn't done yet — flagging
  this now so it isn't mistaken for finished work.
- Multi-monitor pinning, the tray "open settings" action, and the keyboard
  shortcut / auto-hide-timer show/hide paths are not implemented — only the
  tray-click and menu-item toggle exist so far.
- `notes` table is genuinely empty — no CRUD yet, by design (this milestone
  only asked for the table to exist).

### Next up (Milestone 2)

See [ROADMAP.md](ROADMAP.md) — Notes, Alarm, App Shortcuts, Countdown, Habit
Tracker, and Focus Mode widgets, plus the resizable/draggable widget grid.

## Session 2 — 2026-08-16 — Core widgets + dev tooling [CEO-approved]

**Milestone 2 (see [ROADMAP.md](ROADMAP.md)): done**, built on branch
`milestone-2/core-widgets`, merged to `main` via PR once CI confirmed clean
builds on both platforms. Also added a git branching workflow and a
local onboarding tool that weren't part of the original roadmap but were
requested directly this session.

### Branching workflow (new)

`main` stays the always-green, CI-verified branch. Milestone work now happens
on a `milestone-N/description` branch, gets a PR, and only merges once the
Windows + macOS CI matrix is green on it — same bar `PLAN.md` already set for
`main`, just enforced per-branch before integration instead of after.

### Local setup guide + `nanobox` command (new)

- `scripts/setup-guide/` — a small static page (no framework) with copyable,
  OS-aware setup commands (Node, Rust, MSVC/Xcode tools, clone, install, run).
- `scripts/serve-guide.mjs` — dependency-free Node static server + auto-opens
  the default browser at `http://localhost:4317`.
- `npm run guide` runs it from inside the repo. `npm link` (documented in
  README) also registers it as a global `nanobox` command — per the ask, a
  fresh clone can `npm install && npm link` once and then just type `nanobox`
  in any terminal to reopen the guide. Verified both paths end-to-end
  (`npm run guide` and the linked `nanobox` binary) hit `http://localhost:4317`
  with a 200.
- Since there's no packaged installer or store listing yet, the guide (and
  README) are explicit that running from source *is* the current install
  path — future packaged releases will be linked from both places.
- Caught and fixed a real bug while testing this in the browser pane: the
  Windows/macOS step toggle relied on the `hidden` attribute, but `.step {
  display: flex }` had equal CSS specificity and won, so both platforms'
  steps showed at once. Fixed with an explicit `[hidden] { display: none
  !important; }` rule.

### Storage: migration v2

New SQLite tables (`src-tauri/src/lib.rs`, migration version 2): `alarms`,
`shortcuts`, `countdowns`, `habits`, `habit_logs`, `widget_instances`. Typed
CRUD wrappers for each in `src/storage/`. `notes` gained real create/update/
delete/pin methods (Milestone 1 only had `listNotes`).

### Widgets built

- **Notes** — create/edit/delete/pin, 6-colour label swatch, inline edit form.
- **Alarms** — time + label + day-of-week toggles + sound picker. Sounds are
  synthesized with the Web Audio API (`src/widgets/built-in/Alarm/tones.ts`)
  instead of bundled audio files — three distinct oscillator patterns (chime/
  beep/digital), no binary assets to ship. An in-widget scheduler polls every
  20s, fires an OS notification (`tauri-plugin-notification`) plus an inline
  ringing banner with Snooze (+5 min) / Dismiss.
- **App Shortcuts** — add via native file picker (`tauri-plugin-dialog`) or
  by dragging files/apps onto the widget (`getCurrentWebview().onDragDropEvent`);
  launches via `tauri-plugin-opener`'s `openPath`; double-click to rename.
  Icons are a coloured initial tile, not extracted OS icons — real icon
  extraction is unresearched and deferred.
- **Countdown** — label + target date, live days/hours/minutes remaining.
- **Habit Tracker** — daily checkbox per habit, streak computed client-side
  from the last 90 days of logs (`computeStreak` in `src/storage/habits.ts`).
- **Focus Mode** — Pomodoro timer (25/5, not yet user-configurable), OS
  notification on phase change, optional "hide other widgets while focusing"
  wired through a new minimal external store (`src/core/focusModeStore.ts`,
  `useSyncExternalStore`-style, no state library added).

### Widget grid (new: `src/widgets/WidgetGrid.tsx`)

Replaces Milestone 1's single hardcoded `<Clock />`. Widget instances
(type/position/size/opacity) persist in the new `widget_instances` table.
Drag via a hover-revealed grip strip, resize via a corner handle — both hand-
rolled with pointer events + `setPointerCapture`, snapped to 8px on release
(matches `PRODUCT_SPEC.md`'s grid spec). Per-widget gear popover for opacity
+ remove. Bottom-right "+ Add widget" menu to place any of the 7 registry
types. No collision detection — overlapping widgets is possible; not solved
this session.

### Build verification

- `npx tsc --noEmit` — clean.
- `cargo check` — clean, including the two new plugins (`tauri-plugin-dialog`,
  `tauri-plugin-notification`).
- `npm run test` — passing (unchanged Clock test).
- `npm run tauri dev` — compiled and ran with no runtime errors in the
  terminal/webview console log.
- `npm run tauri build -- --debug` — see PR CI status for the Windows +
  macOS matrix result.
- **Not done**: interactive manual QA (actually dragging/resizing widgets,
  clicking through each widget's forms) — Nanobox isn't installed as a
  registered app in this environment, so the available screen-automation
  tooling can't target its window. Verification here is compile + type-check
  + runtime-log-clean, same bar as Milestone 1. Recommend a manual pass
  before relying on drag/resize/forms in daily use.

### Known gaps / deliberately deferred

- Overlay is still `alwaysOnBottom`, not true desktop-embedded (unchanged
  from Milestone 1's disclosed gap).
- Alarm days-of-week + snooze logic is polled every 20s client-side, not a
  real OS-level scheduled task — alarms won't fire if the app isn't running.
- App Shortcuts icons are placeholder tiles, not real extracted icons.
- No widget-collision handling in the grid.
- Focus Mode's 25/5 intervals aren't user-configurable yet.

### Next up (Milestone 3)

Theme engine — token pipeline, all six themes, hot-swapping, accessibility
baseline. See [ROADMAP.md](ROADMAP.md).
