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

### Copilot PR review

GitHub's Copilot reviewer left 8 comments on [PR #1](https://github.com/AShah-01/Nanobox/pull/1).
Fixed before merge: invalid `<p>` directly inside `<ul>` for the empty-state
message (Notes, Alarm, Countdown, Habit Tracker — changed to `<li>`), a
missing `.catch()` on the App Shortcuts drag-drop handler, and an unused
`runningRef` in Focus Mode. One comment was a false positive — it claimed
`path.join(root, path)` in `scripts/serve-guide.mjs` discards `root` because
`path` starts with `/`; that's `path.resolve` behavior, not `path.join`
(verified directly: `join('/a/b','/index.html')` → `a\b\index.html`, and the
guide server had already been curl-tested returning 200). Left as-is. The
remaining comment — WidgetGrid has no tests — is a fair miss; not addressed
this session, noted below.

### Known gaps / deliberately deferred

- Overlay is still `alwaysOnBottom`, not true desktop-embedded (unchanged
  from Milestone 1's disclosed gap).
- Alarm days-of-week + snooze logic is polled every 20s client-side, not a
  real OS-level scheduled task — alarms won't fire if the app isn't running.
- App Shortcuts icons are placeholder tiles, not real extracted icons.
- No widget-collision handling in the grid.
- Focus Mode's 25/5 intervals aren't user-configurable yet.
- No tests for `WidgetGrid` or the new widgets (only `Clock` has coverage).

### Next up (Milestone 3)

Theme engine — token pipeline, all six themes, hot-swapping, accessibility
baseline. See [ROADMAP.md](ROADMAP.md).

## Session 3 — 2026-08-16 — Theme engine, part 1 [CEO-approved]

**Milestone 3 (see [ROADMAP.md](ROADMAP.md)): partially done**, built on
branch `milestone-3/theme-engine`. This session covers the token pipeline,
all six themes, hot-swapping, and the accessibility baseline. Per-theme user
customisation (colour picker, opacity, font/radius/border overrides,
`.nanotheme` export/import) and colour-blindness simulation checks are
deliberately deferred to a future session — the milestone didn't fit in one
night, and this is a complete, reviewable slice rather than a rushed whole.

### Token pipeline

- New `--nb-accent-text` custom property, added to the existing `--nb-*` set
  (`src/themes/base.css`). It was needed, not optional: the seven places that
  put text/icons on an accent-coloured surface (Notes' primary button, Alarm's
  day toggle + primary button, Focus Mode's primary button, Habit Tracker's
  progress fill + primary button, App Shortcuts' upload button, the widget
  grid's "+ Add widget" button) all hardcoded `color: #0d0f16` (near-black).
  That's fine when the accent is light, but several of the new themes use a
  *dark* accent (Matte's navy `#2b3a67`, Liquid Glass's blue `#0059b3`) —
  black-on-navy text would have been unreadable and failed WCAG outright.
  Replaced every hardcoded instance with `var(--nb-accent-text)`, which each
  theme sets to whichever of black/white actually contrasts against its own
  accent colour. Verified computationally (see below), not by eyeballing.
- `src/tokens/tokens.json` restructured: a `default` block mirroring
  `base.css`'s fallback `:root`, plus a `themes` map with one entry per theme
  mirroring its actual CSS file. The CSS files remain the source of truth
  (same relationship the pre-existing tokens.json already had to base.css);
  the JSON is documentation/seed for a future real token→CSS build step, not
  itself consumed by any code yet.

### Six themes (`src/themes/{liquid-glass,matte,glossy,retro,cyberpunk,steampunk}.css`)

Each is a `:root[data-theme="<id>"]` block overriding the full `--nb-*` set,
plus a small amount of theme-specific `.widget-frame` styling for the effects
that CSS custom properties alone can't express:

- **Liquid Glass** — translucent surface colours + `backdrop-filter:
  blur(28px) saturate(180%)` on the widget frame and title bar, large 22px
  radius, soft white inset highlight.
- **Matte** — flat, zero blur/shadow, an inline SVG fractal-noise texture at
  4% opacity blended with `multiply`, small 4px radius, deep navy accent.
- **Glossy** — a white-to-transparent gradient overlay + inset box-shadows
  (light top edge, dark bottom edge) to fake an Aqua-era bevel, bright
  surfaces.
- **Retro** — near-black surface, green phosphor text with a subtle
  text-shadow glow, amber accent, monospace font stack, an animated
  scanline overlay (`repeating-linear-gradient` + `@keyframes`).
- **Cyberpunk** — deep purple-black surface, cyan accent, magenta+cyan glow
  box-shadow on the frame, its own animated scanline overlay, monospace font.
- **Steampunk** — dark brown/sepia surfaces, brass accent, serif font, a
  faint inline-SVG gear watermark in the top-right corner of each widget
  frame, double brass border.
- Fonts are all system/generic stacks (`monospace`, `serif`, platform sans) —
  deliberately not pulling from a web font CDN so the app keeps working
  offline. Bundling real display fonts under `public/fonts/` (the folder
  already exists for this) is future work if the generic stacks aren't
  distinctive enough.
- `data-theme` lives on `<html>` (set synchronously to `"matte"` in
  `index.html` so there's no flash-of-wrong-theme before JS runs, then kept
  in sync by `src/core/themeStore.ts`). All six stylesheets are imported
  once in `main.tsx`; swapping the attribute is what makes theme changes
  instant with no reload — confirmed by clicking through all six in a live
  browser session (see Verification below).

### Switching + persistence

- `src/core/themeStore.ts` — same minimal external-store shape as the
  existing `focusModeStore.ts` (`getTheme`/`setTheme`/`subscribeTheme`), plus
  `initTheme()` to load the persisted choice on startup.
- `src/storage/settings.ts` + migration v3 (`src-tauri/src/lib.rs`) — a new
  generic `app_settings` key/value table (`INSERT ... ON CONFLICT DO
  UPDATE`), used to persist the chosen theme id under the key `"theme"`. This
  is the first use of that table; it's intentionally generic so future
  settings don't each need their own migration.
- `src/components/ThemeSwitcher.tsx` — minimal floating control, bottom-left
  (mirrors the existing "+ Add widget" button's bottom-right placement and
  visual language), `🎨` toggle button opens a menu of all six themes with
  label + one-line description, `role="menuitemradio"` / `aria-checked` on
  each option for the active theme.

### Accessibility baseline

- Contrast: every theme's text/surface, muted-text/surface, and
  accent/accent-text pair was computed with the WCAG relative-luminance
  formula (script in scratchpad, not committed) before writing the CSS, not
  adjusted after the fact. All pairs clear 4.5:1 (AA); Matte clears 7:1
  (AAA) on every pair, matching its "AAA baseline" requirement in
  ROADMAP.md. Full numbers are in this session's tool history if they need
  re-checking later.
- `:focus-visible` — one global rule in `base.css` (`outline: 2px solid
  var(--nb-accent)`) covers every interactive element in every theme
  automatically, since it's written once against the token rather than
  per-widget. Verified via a real Tab keypress in a live page + reading the
  focused element's computed `outline*` properties, not just visual
  inspection.
- `prefers-reduced-motion` — unchanged from Milestone 1's existing global
  rule in `base.css` (kills all `animation-duration`/`transition-duration`).
  Both new theme animations (Retro's and Cyberpunk's scanline drift) use
  plain CSS `animation`, so they're covered by that rule for free — no new
  reduced-motion code needed.
- Colour-blindness simulation checks: **not done this session** — noted as
  deferred in ROADMAP.md rather than silently skipped.

### Verification

- `npx tsc --noEmit` — clean (after `npm install`; `node_modules` wasn't
  present at session start in this container).
- `npm run test` — 3/3 passing. Added `tests/components/ThemeSwitcher.test.tsx`
  (hot-swap updates `document.documentElement.dataset.theme` with no reload;
  all six themes appear in the switcher menu). Also fixed a latent test-infra
  bug while writing it: `tests/setup.ts` had no global
  `afterEach(cleanup)`, so a test file that renders more than once (mine does)
  left stale DOM around from the previous render and `getByLabelText` found
  duplicates. Fixed centrally in `tests/setup.ts` rather than per-file, since
  it would have bitten the next multi-render test too.
- `cargo check` in `src-tauri/` — **could not run**: this container has
  `cargo` installed but not the Linux GTK/GDK system libraries Tauri's Linux
  backend needs (`gdk-3.0` via pkg-config), so the build fails before it
  reaches any of tonight's actual code. This is an environment gap, not a
  code issue — Milestone 1 and 2 sessions hit the same wall implicitly (their
  `cargo check` runs happened on a Windows dev machine, not this container).
  The Rust change this session is small and mechanical (one new `Migration`
  entry, same shape as the existing two) — real verification is the
  `windows-latest`/`macos-latest` matrix in CI on the PR, per
  `.github/workflows/build.yml`.
- Manual visual QA: ran the Vite dev server standalone (`npx vite`, outside
  the Tauri shell — Tauri isn't installed/registered in this container
  either) and drove it with Playwright. Confirmed: switching through all six
  themes changes the switcher/add-widget button colours instantly with no
  navigation; injected a real `.widget-frame` element per theme (the widget
  grid itself can't load without Tauri's SQLite IPC bridge, which isn't
  available outside the real app shell — same limitation Sessions 1-2 noted)
  and confirmed each theme's distinguishing effect renders as intended: Liquid
  Glass's blur, Matte's noise texture, Glossy's bevel/gloss, Retro's and
  Cyberpunk's scanlines, Steampunk's gear watermark. Console showed only the
  expected "Tauri IPC not available" errors already present on every widget
  outside the real shell (not new); no new errors from theme code.

### Known gaps / deliberately deferred

- Per-theme user customisation (colour picker, opacity, font family/scale,
  corner radius, border style, `.nanotheme` export/import) — the second half
  of Milestone 3, not started.
- Colour-blindness simulation checks — not implemented.
- Fonts are generic system stacks, not real bundled display fonts (no
  network font loading, to keep the app working offline) — revisit if the
  themes need to look more distinctive.
- `cargo check` unverified in this environment (see Verification above) —
  CI is the real gate.

### Next up (rest of Milestone 3)

Per-theme customisation UI + `.nanotheme` export/import, then
colour-blindness simulation checks, before moving to Milestone 4
(Integrations). See [ROADMAP.md](ROADMAP.md).

## Session 4 — 2026-08-17 — Icon bug fix + roadmap: new Milestone 4 [CEO-approved]

### Task Manager icon bug — diagnosed and fixed

User reported Task Manager showing the old (pre-logo) icon. Root cause:
`src-tauri/target/debug/nanobox.exe` on disk was built 2026-08-16 21:18,
**before** the logo PR merged the new `icon.ico` (2026-08-17 16:22) — Windows
was correctly showing the icon actually embedded in that stale binary, not a
caching bug. Rebuilt (`npm run tauri build -- --debug`); new exe (16:31)
embeds the current icon. If it's still wrong after a rebuild, that would
point to genuine Explorer/Task Manager icon-cache staleness (fix: restart
`explorer.exe`, or clear `%LocalAppData%\IconCache.db` equivalent), but
that wasn't needed here — a rebuild was the whole fix.

### Roadmap: inserted new Milestone 4, renumbered the rest

Per direct request, researched what ADHD/neurodivergent people actually use
day to day before adding widgets, rather than guessing. Searched for
current (2026) popular ADHD/neurodivergent apps and cross-referenced against
Nanobox's existing 7 widgets to find real gaps, not overlap:

- [5 Best ADHD Apps for Adults (Saner.AI)](https://www.saner.ai/blogs/best-adhd-apps-for-adults)
- [We tested 44 ADHD apps (Saner.AI)](https://blog.saner.ai/best-adhd-apps/)
- [12 Best Apps for ADHD 2026 (Inflow)](https://www.getinflow.io/post/best-apps-for-adhd)
- [Best apps for neurodivergent people 2026 (tonen)](https://usetonen.com/blog/apps-for-neurodivergent-people)
- [Focus Apps for ADHD: 2026 Analysis (Brain.fm)](https://www.brain.fm/blog/focus-apps-for-adhd)
- [Time Blindness in ADHD (Simply Psychology)](https://www.simplypsychology.com/articles/adhd-time-blindness-management)
- [Flow Club: Body Doubling for ADHD](https://www.flow.club/what-is-body-doubling)

Recurring patterns not yet in Nanobox: Tiimo's visual/colour daily timeline
(time blindness), Time Timer's shrinking-disk visual countdown (time
blindness, distinct from Focus Mode's digital Pomodoro), Goblin.tools'
"Magic ToDo" task breakdown (task-initiation paralysis), frictionless
single-line capture (the universal "write it down before you lose it"
pattern, distinct from Notes' heavier create/edit flow), daily mood
check-ins (common across Finch/Inflow), and gentle interval-based nudges
(Sprout/Finch — distinct mechanic from Alarm's clock-time model).
Focusmate-style live body-doubling was researched and deliberately **not**
added — it needs a real-time matching/presence backend, out of scope for a
local-first single-user app with no server.

Added as the new **Milestone 4** in `ROADMAP.md` (renumbering the former
4/5/6 — Integrations, Lego block builder, Polish & release — to 5/6/7):
Visual Timer, Today Timeline, Brain Dump, Task Breakdown, Mood Check-in,
Gentle Reminders, and a stretch-goal Companion widget (cosmetic only, reads
existing `habits`/`habit_logs` data — cut first if the milestone runs long).
Updated `PLAN.md`'s "current focus" and milestone list to match; the nightly
cron routine's prompt already says "defer to what ROADMAP.md/PROGRESS.md say
is next" rather than hardcoding a milestone number, so it needed no change.

### Next up (Milestone 4)

Visual Timer, Today Timeline, Brain Dump, Task Breakdown, Mood Check-in,
Gentle Reminders widgets (Companion widget if time allows). See
[ROADMAP.md](ROADMAP.md).
