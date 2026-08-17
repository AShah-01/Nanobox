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

## Session 5 — 2026-08-17 — Milestone 4: everyday toolkit widgets [CEO-approved]

**Milestone 4 core set: done** (6 of 7 — Companion widget cut, see below).
Built on branch `milestone-4/adhd-toolkit`.

### Storage: migration v4

New tables in `src-tauri/src/lib.rs`: `timeline_blocks`, `brain_dump_entries`,
`task_breakdowns` + `task_breakdown_steps`, `mood_logs` (unique per
`log_date`, upserts on re-log), `reminders`. Typed CRUD wrappers in
`src/storage/{timeline,brainDump,taskBreakdowns,moodLogs,reminders}.ts`,
following the same pattern as Milestone 2's storage modules.

### Widgets built

- **Visual Timer** — Time Timer-style shrinking disk via a CSS
  `conic-gradient` driven by a `--pct` custom property (no canvas/SVG
  needed). Minute presets (5/10/15/25/45) + custom input. Reuses
  `Alarm/tones.ts`'s `playTone` for the completion chime rather than
  duplicating tone-synthesis code — that file was already a generic
  Web-Audio utility, not Alarm-specific.
- **Today Timeline** — manually-entered time blocks (icon, label, colour,
  start/end), sorted by start time, current block highlighted by comparing
  against the clock each minute. Chose a highlighted-list layout over a
  literal pixel-positioned timeline strip — same "colour + icon at a
  glance" value Tiimo has, far less rendering complexity, and it doesn't
  break if blocks overlap or don't cover the full day.
- **Brain Dump** — single input, Enter to save, reverse-chronological list.
  Deliberately has no title/colour/pin — friction is the thing being
  removed here, and Notes already covers the heavier case.
- **Task Breakdown** — Goblin.tools' Magic ToDo without the AI call: title
  a big/vague task, add checkbox steps underneath by hand, per-breakdown
  progress count.
- **Mood Check-in** — 5-emoji scale, tap logs today (upsert, so re-tapping
  changes today's entry instead of duplicating), optional note, 7-day
  history strip.
- **Gentle Reminders** — interval-based (not clock-time) nudges. On
  creation, immediately calls `markReminderFired` with the current
  timestamp so the interval clock starts from creation rather than firing
  right away. A 30s poll compares `last_fired_at` + `interval_minutes`
  against now, fires an OS notification + `playTone("beep")`.
- **Companion widget — cut this session.** Listed as a stretch goal
  explicitly meant to be cut first if time ran short; the other six
  widgets plus their storage layer, registry wiring, and verification
  already matched Milestone 2's scope for one session. Left for a future
  session — it's cosmetic-only and reads data that already exists
  (`habits`/`habit_logs`), so it's cheap to pick up later without touching
  anything built this session.

### Registry

`src/widgets/registry.ts` grew from 7 to 13 `WidgetId`s with matching
`WIDGET_LABELS` and `DEFAULT_SIZE` entries; `src/widgets/built-in/index.ts`
exports the six new components. No changes needed to `WidgetGrid.tsx`
itself — the registry indirection from Milestone 2 meant new widgets are
just data, not new grid code.

### Also this session: Task Manager icon fix

See the top of this session's work in the repo history — diagnosed as a
stale local build (exe predated the logo-merge icon files), fixed by
rebuilding. Full detail was written before this widget work started; see
the "Task Manager icon bug" note above if this file gets reordered.

### Build verification

- `npx tsc --noEmit` — clean.
- `cargo check` — clean, including migration v4.
- `npm run test` — 3/3 passing (unchanged from Session 3).
- `npm run tauri build -- --debug` — **succeeded** on Windows: produced
  `nanobox.exe`, MSI, and NSIS installer.
- Same standing limitation as every prior session: no interactive manual
  QA in this environment (Nanobox isn't a registered app, so screen
  automation can't target its window). Recommend a manual pass on the six
  new widgets, particularly Gentle Reminders' interval scheduler and
  Visual Timer's countdown-through-zero behaviour.

### Known gaps / deliberately deferred

- Companion widget not built (see above).
- Today Timeline blocks are manual entry only — no calendar feed yet
  (arrives with Milestone 5's Calendar widget).
- Gentle Reminders and Visual Timer, like Alarm, only run while the app is
  running — no OS-level scheduled task.
- No tests added for the six new widgets (same gap flagged for Milestone 2
  in session 2 — `WidgetGrid` and most built-in widgets still only have
  `Clock`'s coverage).

### Also this session, outside the Milestone 4 widget list (direct user request)

**Title bar / window drag — real bug, fixed.** The user reported not being
able to move the app on their desktop at all — no visible top bar, nothing
to grab. Root cause: `src/components/WidgetFrame.css` had
`-webkit-app-region: drag` on `.widget-frame`, which is the Electron-era
mechanism and isn't reliably honoured by Tauri's WebView2 host on Windows —
it never worked. Tauri's actual mechanism is the `data-tauri-drag-region`
HTML attribute. Added `src/components/TitleBar.tsx` — a 32px bar with the
Nanobox mark, wordmark, and a hide-to-tray button — using that attribute,
rendered above `WidgetGrid` in `App.tsx`. Removed the dead
`-webkit-app-region` rules from `WidgetFrame.css`. Verified conceptually
against Tauri's documented behavior (interactive children of a
drag-region element stay clickable); full interactive drag confirmation is
part of the standing "no registered-app screen automation" gap noted every
session — recommend the user confirm the window now drags from the new bar.

**Custom Widget capability (MVP precursor to Milestone 6).** Requested
directly: "so the devs who are also my audience can customise their own
widget to have much more capabilities." Rather than build the full
Milestone 6 block engine (React Flow canvas, typed ports, block library —
a multi-week feature on its own) in the middle of a widget-milestone
session, shipped a smaller real capability now:

- `src/widgets/built-in/CustomWidget/CustomWidget.tsx` — an editor (HTML/
  CSS/JS textareas) and a live preview `<iframe sandbox="allow-scripts">`
  with **no** `allow-same-origin`. That combination gives the frame an
  opaque origin: its JS cannot reach `window.parent`, Nanobox's SQLite
  data, or any Tauri API, because there's no origin match and no injected
  `__TAURI__` bridge in the iframe's document. That's a real, meaningful
  boundary, not security theatre.
- Honest limitation, documented in-widget and here: this sandbox does
  **not** block outbound network calls (`fetch`/`XMLHttpRequest`) from the
  widget's own JS — only isolation from the host app. The Milestone 6 design
  (Compartment/ShadowRealm + whitelisted bridge API) is the version that
  closes that gap; this is explicitly a narrower precursor, not a
  replacement.
- Storage: reused `widget_instances.settings` (added in Milestone 2's
  schema, unused until now) rather than a new table — it's a per-instance
  JSON blob, `{html, css, js}`, which is exactly what that column was for.
  Added `updateWidgetSettings` to `src/storage/widgetInstances.ts`.
- `WidgetGrid.tsx` special-cases `widget_type === "custom"` to render
  `<CustomWidget instance={...} />` instead of the normal no-props
  registry lookup, since this is the one widget type that needs its own
  instance data. `WIDGET_REGISTRY`'s type now excludes `"custom"`
  (`Record<Exclude<WidgetId, "custom">, ComponentType>`) to keep that
  honest at the type level; the add-widget menu was switched from
  iterating `WIDGET_REGISTRY` to iterating `WIDGET_LABELS` so Custom
  Widget still shows up there.
- README's Contributing section rewritten (was: "not open for external
  contributions" — no longer true) to actually invite collaborators, and
  points to this feature as a concrete on-ramp.

### Build verification (this session, full)

- `npx tsc --noEmit` — clean, including the title bar SVG import and the
  registry's `Exclude<WidgetId, "custom">` typing.
- `npm run test` — 3/3 passing.
- `npm run tauri build -- --debug` — succeeded on Windows (see repo history
  for exact timing; same MSI/NSIS output pattern as every prior session).

### Next up (Milestone 5)

Calendar (Google/iCal) and Music (Spotify/Apple Music/YouTube)
integrations. See [ROADMAP.md](ROADMAP.md).

## Session 6 — 2026-08-17 — Milestone 5: local-first integrations foundation [CEO-approved]

**Milestone 5: local-first portion done, OAuth portion explicitly gated on
credentials.** Before writing any code, flagged the real blocker to the
user: Google Calendar, Spotify, Apple Music, and YouTube all require OAuth
credentials registered under a real account (Google Cloud project, Spotify
Developer app, a *paid* Apple Developer membership for MusicKit, a YouTube
Data API key) — none of which an agent can self-provision. User chose
"local-first now, wire up OAuth later": build everything genuinely usable
without external accounts, with real (not stubbed/faked) code throughout,
and leave the OAuth completion step clearly gated for whenever credentials
exist.

### Secure token storage (new, reusable infra)

`src-tauri/src/lib.rs` gained three commands — `secure_set`, `secure_get`,
`secure_delete` — wrapping the `keyring` crate (v3, with `apple-native` +
`windows-native` + `sync-secret-service` features for the OS-native
credential stores on each target platform). This is exactly what
PRODUCT_SPEC.md calls for: integration tokens live in the OS keychain,
never SQLite, never a plaintext file. `src/storage/secureStore.ts` wraps
the three commands for the frontend. Verified the crate/feature choice via
a web search before writing Cargo.toml (rather than guessing feature-flag
names and iterating blind) — `cargo check` compiled clean on the first
attempt, including the `keyring::Error::NoEntry` match arm and
`delete_credential()` method name.

Also added a plain `read_text_file` command (`std::fs::read_to_string`) for
reading a user-picked `.ics` file — deliberately did *not* pull in
`tauri-plugin-fs` and fight its path-scoping ACL for this, since the path
already comes from a trusted native file-picker dialog (same trust model as
the App Shortcuts widget's file picker from Milestone 2).

### Calendar widget — fully working today

- `src/integrations/calendar/ics.ts`: a minimal RFC 5545 subset parser —
  unfolds continuation lines, reads `VEVENT` `UID`/`SUMMARY`/`DTSTART`/
  `DTEND`. Deliberately does **not** expand `RRULE` recurrence or convert
  `TZID`-qualified times to the local zone — both documented as real gaps
  below rather than silently producing wrong dates.
- Migration v5: `calendar_events` table (`UNIQUE(uid, start_at)` so
  re-importing the same file doesn't duplicate events).
  `src/storage/calendarEvents.ts` — `listEventsInRange`, `importIcsEvents`
  (uses `INSERT OR IGNORE`, returns how many were actually new).
- `src/widgets/built-in/Calendar/Calendar.tsx` — Day/Week/Month view
  toggle (per the original spec line), "Import .ics file" button
  (`tauri-plugin-dialog` → `read_text_file` → `parseIcs` →
  `importIcsEvents`), prev/next/Today navigation. Month view is a compact
  grid with a dot on days that have events, not a full agenda — clicking a
  day jumps to Day view for it.

### Music widget — real architecture, no live data yet (by design)

- `src/integrations/music/types.ts` — the unified `NowPlayingData`
  interface exactly as specified (`title`, `artist`, `album`, `artworkUrl`,
  `isPlaying`, `progressMs`, `durationMs`, `source`).
- `src/integrations/music/adapters.ts` — one `MusicAdapter` factory used
  for all four sources (Spotify, Apple Music, YouTube Music, YouTube)
  rather than four near-identical files, since none has distinct logic
  yet: `isConfigured()`/`saveCredential()`/`clearCredential()` all go
  through `secureStore.ts`, and `getNowPlaying()` honestly returns `null`
  for every source — there is no fake/mocked "now playing" data anywhere.
- `src/widgets/built-in/Music/Music.tsx` — per-source tabs (● = credential
  saved, ○ = not), a "not connected" placeholder card where the real
  now-playing card will render once wired up, a credential-entry form that
  saves to the keychain, and a link (via `openUrl`, opens in the real
  system browser, not a webview popup) to where the user gets that
  credential for the selected source.

### What OAuth completion actually needs, per source (for whoever picks this up next)

- **Spotify**: PKCE flow is fully client-side-feasible (no client secret
  needed for a public/desktop client), but a desktop app needs to *catch*
  the redirect after the user authorizes — that means either a custom URL
  scheme (`tauri-plugin-deep-link`) or a temporary local loopback HTTP
  server in Rust to receive the auth code. Neither is implemented; this is
  the actual next chunk of work once a Spotify Developer app + client ID
  exist.
- **Apple Music**: needs a *paid* Apple Developer Program membership
  ($99/yr) to generate a MusicKit private key + developer token — cannot
  proceed at all without the user having that account.
- **YouTube Music**: no official now-playing API; the plan (per
  PRODUCT_SPEC.md) is Odesli polling as a fallback — not yet implemented.
- **YouTube**: needs a Google Cloud API key (Data API v3) — simplest of
  the four once a key exists, no OAuth redirect dance required for public
  data.

### Registry

`WidgetId` grew from 14 to 16 (`calendar`, `music`), following the same
pattern as every prior widget addition — `WidgetGrid.tsx` needed no changes.

### Build verification

- `npx tsc --noEmit` — clean, including the `openUrl` import guess from
  `@tauri-apps/plugin-opener` (correct on the first try).
- `cargo check` — clean, including the `keyring` crate integration.
- `npm run test` — 3/3 passing.
- `npm run tauri build -- --debug` — see repo history for this session's
  run; same MSI/NSIS output pattern as every prior session.

### Known gaps / deliberately deferred

- No OAuth completion for any music source or Google Calendar — the whole
  point of this session's scoping decision, tracked above per-source.
- `.ics` parser doesn't expand recurring events (`RRULE`) or handle
  `TZID` time zone conversion — both silently-wrong-data risks if not
  flagged, so flagging them here instead of pretending they're handled.
- Calendar's Week/Month views only show event *counts*/dots, not titles —
  a deliberate simplification to fit widget-sized space; Day view (the
  default) shows full titles and times.
- No tests added for Calendar or Music (same standing gap as every widget
  since Milestone 2 — only `Clock` and `ThemeSwitcher` have coverage).

### Next up (rest of Milestone 5, then Milestone 6)

Whoever has real API credentials: wire up Spotify PKCE (needs the
redirect-capture mechanism above), Google Calendar OAuth, YouTube Data API,
and/or Apple MusicKit. Otherwise, next unblocked work is Milestone 6 (lego
block widget builder) or finishing Milestone 3's per-theme customisation
UI. See [ROADMAP.md](ROADMAP.md).
