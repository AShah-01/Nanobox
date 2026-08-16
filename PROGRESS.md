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
