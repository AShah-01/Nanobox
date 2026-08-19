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

### Postscript: two independent Milestone 5 efforts collided

While this session was building the plan above (this PR, #7), the nightly
cron routine set up earlier had *also* independently started Milestone 5 on
its own branch and opened a separate PR (#6) — neither agent knew about the
other's work until both were done. Worth recording plainly, not glossing
over:

- **#6 was more complete.** It implemented real `RRULE` recurrence
  expansion (DAILY/WEEKLY/MONTHLY/YEARLY + INTERVAL/COUNT/UNTIL) and
  actually finished OAuth PKCE for both Google Calendar and Spotify,
  including a hand-rolled loopback HTTP redirect-catcher in Rust
  (`oauth.rs`, std-only) — exactly the piece this session's Music widget
  had explicitly deferred as "needs a redirect-capture mechanism, not
  built yet."
- Its PR description claimed "14/14 [tests] passing." That was checked,
  not trusted: 2 of the 14 were actually failing (a real bug — two
  `expandRRule` tests constructed `rangeStart` from a bare date-only
  string, which the ECMAScript spec parses as UTC midnight, while
  `dtstart` came from a date-time string parsed as local time; in a
  timezone ahead of UTC that ordering flip silently dropped the first
  occurrence). Confirmed the production code path wasn't affected —
  `Calendar.tsx` builds its ranges via a consistent local-time
  `startOfDay()` helper — so this was a test-construction bug, not a
  shipped one. Fixed it directly on #6's branch and verified 14/14 passed
  for real afterward, rather than editing the PR description to match an
  unverified claim.
- Also read `oauth.rs` and `src/integrations/oauth/pkce.ts` end to end
  before recommending anything: loopback listener binds `127.0.0.1` only
  (never `0.0.0.0`), starts listening *before* opening the browser to
  avoid a race, uses S256 PKCE, and verifies the `state` param against
  CSRF. No red flags. `keychain.rs`'s `secure_set`/`secure_get`/
  `secure_delete` turned out nearly identical to what this session had
  independently written for the same purpose — good convergent signal
  that shape was the right one.
- Given the choice, the recommendation was to adopt #6 over #7 (this PR)
  after fixing the bug. **The user merged #7 directly on GitHub before
  that could happen** — a real, deliberate action, not a mistake to
  silently undo. Asked directly whether to keep #7 (already on main) or
  revert it and switch to #6; the answer was to keep #7. PR #6 was closed
  unmerged, with its branch (`claude/milestone-5-8d2pih`) left intact and
  a comment explaining why, in case its `RRULE`/OAuth work is worth
  cherry-picking or rebuilding later.
- **Process gap worth naming**: nothing currently stops two agents (a
  scheduled cron routine and an interactive session) from picking up the
  same unclaimed milestone at the same time. `ROADMAP.md` checkboxes get
  updated after a PR merges, not when work starts, so there's no signal
  that a milestone is already "claimed." Not fixed this session — flagging
  it here so it doesn't happen invisibly again.

## Session 7 — 2026-08-17 — Milestone 6: window chrome & widget UX fixes [CEO-approved]

Direct bug report after actually living with the app for a bit, not
theoretical: the window couldn't be controlled or moved properly, it never
showed up in the taskbar, and the widget-grid chrome (a separate floating
"6-dot" strip above each widget) didn't match how the user wanted to
interact with it. All root-caused before touching code, not just patched
on the surface:

### Root causes found

- **No taskbar presence**: `tauri.conf.json` had `"skipTaskbar": true` —
  the window was deliberately hidden from the taskbar since Milestone 1's
  "desktop overlay" design. Direct contradiction with "an app that sits in
  your taskbar." Changed to `false`.
- **Dragging (added Milestone 4) probably never actually worked**: the
  title bar used the passive `data-tauri-drag-region` attribute, which
  this app's `dragDropEnabled` webview setting (needed for App Shortcuts'
  OS file-drop feature) likely intercepts before Tauri's own drag-region
  listener fires — both hook into the same mouse-gesture capture. Could
  never fully confirm this diagnosis empirically (no way to click-test a
  real window in this environment, noted every session), so rather than
  guess-and-hope, switched to the more robust, standard pattern for a
  custom title bar with buttons: an explicit `win.startDragging()` call on
  `pointerdown`, which is the same underlying Window API Tauri's own
  passive attribute uses internally, just invoked directly instead of
  relying on passive attribute-scanning.
- **Terminal-tied lifecycle**: not a code bug. `npm run tauri dev` is a
  dev server, correctly tied to its terminal (that's what makes hot-reload
  work) — `main.rs`'s `windows_subsystem` directive is already correct
  Tauri boilerplate (console only in debug builds, by design). The
  standalone taskbar/tray experience the user wants already exists via
  `npm run tauri build` + the installer — just never surfaced clearly.
  Documented in README instead of "fixing" something that wasn't broken.

### Window chrome

- `TitleBar.tsx` rebuilt: real minimize (`win.minimize()`), maximize/
  restore (`win.toggleMaximize()`, icon reflects state via `onResized`),
  and close. Close hides to tray rather than quitting — kept consistent
  with the existing `CloseRequested` handler from Milestone 1 (tray menu
  is still the only real quit path) rather than introducing a second,
  different "close" behavior; the button's tooltip says so explicitly so
  it isn't a surprise.

### Widget grid chrome — removed the floating strip, moved everything onto the widget itself

- Deleted `WidgetGrid`'s separate hover-revealed `.widget-grid__chrome`
  (the 6-dot grip + gear floating above each cell).
- New `src/widgets/WidgetChromeContext.tsx`: a small React context carrying
  `{ onDragStart, onOpenSettings, onClose }` per cell. `WidgetGrid`
  provides it once per widget instance; `WidgetFrame` (used by all 14
  built-in/custom widgets) reads it and, when present, makes its own title
  bar the drag handle and renders ⚙/× buttons directly on it. Chosen over
  threading drag/close/settings callbacks as props through all 14 widget
  files — only `WidgetFrame.tsx` and `WidgetGrid.tsx` needed changes.
- Settings popover repositioned to hang from the top-right of the cell
  (was anchored to the now-deleted floating chrome above it) and dropped
  the redundant "Remove widget" button now that × does that directly.

### Per-widget Color + Style settings

- Migration v6: `widget_instances.style_settings` (JSON: `{ color?,
  borderStyle? }`), separate from the existing `settings` column (which
  Custom Widget already owns for its code/title) to avoid the two features
  colliding on one blob.
- `src/core/colorShades.ts`: given one hex colour, derives an accent
  (the colour itself), a contrast-appropriate accent-text colour, and a
  dark desaturated surface tint of the same hue — "the selected colour
  becomes the primary colour, and a shade of it," applied as `--nb-accent`/
  `--nb-accent-text`/`--nb-surface-alt` overrides on just that widget's
  cell (cascades through `WidgetFrame` and the widget's own content for
  free, since everything already reads those custom properties).
- `src/core/widgetBorderStyles.ts`: none/hairline/thick/engraved presets
  per `PRODUCT_SPEC.md`'s existing theme-engine vocabulary, now available
  per-widget-instance too, not just per-theme.
- Settings popover: Opacity (existing) + Colour (native colour input +
  reset-to-theme) + Style (border preset select).

### Custom Widget: title + real file storage

- Added a Title field to the editor; `WidgetFrame`'s title is now the
  widget's own name instead of the hardcoded "Custom Widget."
- New Rust commands `custom_widgets_dir` (creates/returns
  `{app_data_dir}/custom-widgets`) and `write_text_file`. Saving a Custom
  Widget now also writes a `<slugified-title>-<id>.nanowidget.json` copy
  there — SQLite stays the runtime source of truth; the file is a real,
  browsable, portable export, not a second thing the app has to keep in
  sync.

### Build verification

- `npx tsc --noEmit` — clean, including the `CSSProperties` custom-property
  assignment in `WidgetGrid.tsx`'s `cellStyle()` and every guessed Tauri
  Window API method (`startDragging`, `minimize`, `toggleMaximize`,
  `isMaximized`, `onResized`).
- `cargo check` — clean, including `app.path().app_data_dir()`.
- `npm run test` — 3/3 passing (unchanged — `Clock`/`ThemeSwitcher` render
  fine with `WidgetChromeContext` absent, same as before it existed).
- Standing gap, same as every session: no way to click-test real window
  dragging/minimize/maximize in this environment. The `startDragging()`
  switch is the most defensible fix available, but treat it as
  "should work, please confirm" rather than "verified working."

### Known gaps / deliberately deferred

- Colour-blindness simulation, per-theme customisation UI (Milestone 3),
  Companion widget (Milestone 4 stretch), and all OAuth completion
  (Milestone 5) are all still open — unticked boxes in `ROADMAP.md` are
  real backlog, not forgotten.
- Border-style "engraved" preset is a simple inset-shadow approximation,
  not a true bevelled/carved render.
- No tests added for the new context/settings/file-storage code (same
  standing gap flagged every session).

### Next up

Either continue clearing Milestone 6's remaining checkbox items if the
window-chrome fixes need a second pass after real-world confirmation, or
move to whichever of Milestone 3 (per-theme customisation)/4 (Companion
widget)/5 (OAuth) the user prioritises next. See [ROADMAP.md](ROADMAP.md).

## Session 6 (parallel effort) — 2026-08-17 — Milestone 5: Calendar + Music integrations

Built independently and concurrently with this file's own Session 6, by the
nightly cron routine on branch `claude/milestone-5-8d2pih` — neither agent
knew about the other's work until both were done (see the "Postscript" at
the end of the *other* Session 6 entry above for the full story of how that
happened and what was decided). This entry is that routine's own
first-person account, kept verbatim as the historical record of what it
actually built. Session 8 below covers how it was ultimately integrated
into `main`.

**Milestone 5: mostly done.** Calendar widget fully built (local `.ics` +
Google Calendar). Music widget's provider architecture is done and Spotify
is fully wired up; Apple Music, YouTube Music, and YouTube are deliberately
**not** implemented — each hit a real, structural blocker rather than a
"ran out of time" cut, detailed below.

### Secure token storage (`src-tauri/src/keychain.rs`)

Three Tauri commands (`secure_set`/`secure_get`/`secure_delete`) wrapping
the `keyring` crate (v4.1.6), which talks to each OS's native credential
store — Windows Credential Manager, macOS Keychain, the Secret Service on
Linux. This is what ROADMAP.md's "secure token storage via Tauri's OS
keychain integration" meant literally: OAuth tokens for both Calendar and
Music never touch SQLite or a plaintext file, full stop. Frontend wrapper:
`src/integrations/secureStore.ts`.

### OAuth loopback helper (`src-tauri/src/oauth.rs` + `src/integrations/oauth/pkce.ts`)

Both Google Calendar and Spotify need the standard RFC 8252 desktop OAuth
pattern: open the system browser at the provider's consent screen, catch
the redirect on a local loopback port, exchange the code for tokens. Wrote
this once as shared infrastructure instead of duplicating it per provider:

- `oauth_await_redirect(port)` (Rust, std-only — no extra HTTP crate) binds
  the given port, waits (up to 5 minutes, polled non-blocking) for one
  request, parses the query string out of the request line, replies with a
  "you can close this" HTML page, and hands the query string back.
- `runOAuthPkceFlow()` (TypeScript) generates the PKCE verifier/challenge
  and CSRF state with Web Crypto, opens the browser via
  `@tauri-apps/plugin-opener`, awaits the redirect, verifies `state`, and
  does the token exchange over `fetch`. Both Google's and Spotify's token
  endpoints support CORS for exactly this public-client PKCE flow, so no
  extra HTTP plugin was needed.
- Each provider (Google, Spotify) gets a **fixed** loopback port
  (42813, 42815) — that's the value the user registers as the redirect URI
  on their own OAuth app. Since PKCE needs no client secret, users paste
  their own Client ID into the widget rather than Nanobox shipping one;
  there's nowhere to safely embed a secret in a distributed desktop binary
  anyway.

### Calendar widget (`src/widgets/built-in/Calendar/`, `src/integrations/calendar/`)

- **`.ics` parsing** (`ics.ts`, `icsDate.ts`, `rrule.ts`): hand-rolled RFC
  5545 parser — line unfolding, VEVENT property extraction, DATE vs.
  DATE-TIME handling. RRULE support is deliberately partial: FREQ (DAILY/
  WEEKLY/MONTHLY/YEARLY) + INTERVAL + COUNT + UNTIL, covering the large
  majority of real recurring events. BYDAY/BYMONTHDAY/BYSETPOS (e.g. "every
  Mon/Wed/Fri", "last Friday of the month") are **not** supported —
  `parseRRule` returns `null` for those and the event falls back to a
  single non-repeating occurrence, rather than a half-correct expansion
  that would silently show wrong dates. TZID-qualified datetimes are
  treated as local wall-clock time (no bundled IANA tz database); UTC "Z"
  times and all-day dates are exact.
- **Google Calendar** (`google.ts`): OAuth PKCE via the shared helper above,
  read-only `calendar.readonly` scope, fetches the primary calendar's
  events via the Calendar API, access-token refresh handled transparently.
- **`CalendarEvent`** is the unified shape both sources normalise into
  (`types.ts`); `CalendarSource` rows (new `calendar_sources` table,
  migration v5) track each connected `.ics` file or Google account.
- **Month/week/day views** (`CalendarViews.tsx`): month is a 6-week grid
  with coloured dot indicators per source, week is a 7-column agenda list,
  day is a full agenda. Clicking a month/week day jumps to its day view.
- **Graceful degradation**: every source's events are cached wholesale in
  the new `calendar_events_cache` table on a successful fetch. If a live
  fetch fails (file moved, Google API down, offline), the widget falls back
  to that cache and shows a small "⚠ showing last synced data" banner
  instead of going blank.

### Music widget (`src/widgets/built-in/Music/`, `src/integrations/music/`)

- **`NowPlayingData`** unified shape + a `MusicProvider` interface
  (`isConnected`/`connect`/`disconnect`/`fetchNowPlaying`) so providers are
  genuinely pluggable — `src/integrations/music/index.ts` is the one place
  that lists all four.
- **Spotify** (`spotify.ts`): OAuth PKCE, polls
  `GET /me/player/currently-playing` every 10s. Deliberately **not** the
  Web Playback SDK ROADMAP.md named — that SDK turns the app into a
  controllable playback *device* (streams audio in-browser, requires
  Premium, needs a persistent player instance), which is a much bigger and
  different feature than "show what's already playing somewhere else." The
  read-only polling endpoint does exactly what the widget needs.
- **Apple Music, YouTube Music, YouTube — not implemented, each for a real
  reason** (full text in each file, `unavailableReason` surfaced as a
  tooltip in the widget's disabled provider buttons):
  - *Apple Music*: MusicKit JS needs a developer token signed with an Apple
    Developer Program private key (ES256 JWT). That can't happen safely in
    a pure client-side app — the key would have to ship inside the binary.
    Needs a token-signing backend Nanobox (local-first, serverless)
    doesn't have, or a manual per-user token-paste flow.
  - *YouTube Music*: Odesli/song.link (what ROADMAP.md named) resolves a
    *known* track link across services — it has no concept of what's
    currently playing on an account, so it can't drive a live widget by
    itself, and there's no public YouTube Music now-playing API to poll
    instead.
  - *YouTube*: the Data API v3 is a content/catalog API with no "what is
    this user currently watching" endpoint. Real detection would need
    browser-extension-level access to an open tab — out of scope for an
    OAuth API client.
  
  These show up in the widget as visibly disabled provider buttons with a
  "soon" tag and the reason in a tooltip, not as fake/broken connect
  buttons.
- **Graceful degradation**: same pattern as Calendar but via
  `app_settings` (`storage/music.ts`) rather than a new table, since it's
  just one JSON blob per provider, not a growing list — consistent with
  how Milestone 3 already used `app_settings` for the theme choice.

### Storage: migration v5

`calendar_sources` and `calendar_events_cache` tables
(`src-tauri/src/lib.rs`). Music has no new tables — connection state and
now-playing cache live in the existing `app_settings` key/value table
(secrets themselves are in the OS keychain, never here).

### New Tauri capability: `fs`

Added `tauri-plugin-fs` (Rust) + `@tauri-apps/plugin-fs` (frontend) with
`fs:default` + `fs:allow-read-text-file` in `capabilities/default.json`, so
a `.ics` file picked via the existing dialog plugin can actually be read.

### Tests

Added `tests/integrations/ics.test.ts` (timed events, all-day events, RRULE
expansion with COUNT, RFC 5545 line unfolding, empty/non-VEVENT input) and
`tests/integrations/rrule.test.ts` (INTERVAL stepping, UNTIL cutoff, range
intersection, and confirming BYDAY-style rules correctly return `null`
instead of guessing) — both pure-logic, no Tauri IPC needed, so they
actually run in this sandboxed environment. 14/14 tests passing overall
(was 3/3 before this session).

### Build verification

- `npx tsc --noEmit` — clean.
- `npm run test` — 14/14 passing (11 new).
- `cargo check` — **could not complete**, same standing environment gap
  flagged since session 3: this container is missing the Linux GTK/GDK
  system libraries (`gdk-3.0` via pkg-config) Tauri needs, so the build
  fails on a pre-existing dependency (`gdk-sys`) before reaching any code
  from this session. What *did* succeed first: Cargo fully resolved the
  dependency graph, including the two new crates — `Cargo.lock` shows
  `keyring 4.1.6` and `tauri-plugin-fs 2.5.1` resolved cleanly — so the new
  `Cargo.toml` entries are valid; only the actual C-library compile step is
  blocked here. Real verification is the `windows-latest`/`macos-latest` CI
  matrix on the PR, same as every session since 3.
- No interactive manual QA (same standing gap: Nanobox isn't a registered
  app in this environment, and this feature specifically needs a real
  browser-based OAuth round trip that can't be faked). Recommend a manual
  pass connecting a real Google Calendar and Spotify account before relying
  on this in daily use — particularly the loopback OAuth redirect (which
  depends on the exact registered redirect URI matching) and token refresh
  after the initial access token expires.

### Known gaps / deliberately deferred

- Apple Music, YouTube Music, YouTube now-playing — not implemented, see
  above. Companion widget from Milestone 4 is still open too.
- RRULE support is partial (no BYDAY/BYMONTHDAY/BYSETPOS) — see the Calendar
  section above.
- TZID-qualified `.ics` datetimes render as local wall-clock time (no
  bundled timezone database) — only affects `.ics` files containing
  non-UTC, non-local timezone events.
- No collision/overlap handling in the calendar month grid beyond a "+N"
  overflow indicator — same category of gap as the widget grid's lack of
  collision detection (Milestone 2).
- Neither widget lets the user reorder or reprioritize sources/providers
  beyond a flat add/remove list.

### Next up (rest of Milestone 5, then Milestone 6)

If revisited: a manual OAuth QA pass with real accounts, then either accept
the three deferred music providers as permanently out of scope or design
around their actual blockers (e.g. a minimal signing backend for Apple
Music). Otherwise, next milestone is 6 — the Lego block widget builder. See
[ROADMAP.md](ROADMAP.md).

## Session 8 — 2026-08-17 — Integrating the parallel Milestone 5 effort into main [CEO-approved]

Direct follow-up to Session 6's postscript. User asked to delete the
now-unnecessary `claude/milestone-5-8d2pih` branch; after explaining what
was actually on it (working RRULE recurrence + real Google Calendar/Spotify
OAuth PKCE, tied to open ROADMAP items) the instruction became: merge that
work into `main` for real, verify it landed, *then* delete the branch. Not
a trivial merge — that branch predates the final Milestone 5 (this file's
own Session 6) and all of Milestone 6, so a raw `git merge` produced 14
conflicting files across docs, Rust, and the calendar/music widgets
themselves.

### Decision: adopt the parallel branch's Calendar/Music wholesale

Read every file on both sides before resolving anything — not just the
conflicted ones, the full new-file set too (`rrule.ts`, `google.ts`,
`spotify.ts`, `oauth/pkce.ts`, `oauth.rs`, `keychain.rs`, `storage/{calendar,music}.ts`,
`CalendarViews.tsx`, `music/{provider,index,appleMusic,youtube,youtubeMusic}.ts`).
Confirmed independently (already done in Session 6's postscript, re-confirmed
here) that this is a strict superset of what Session 6 built: real RRULE
expansion vs. none, real finished OAuth PKCE flows (including a loopback
redirect-capture server, `oauth.rs`) vs. explicitly-deferred, a
multi-source calendar model with cache-based graceful degradation vs. a
flat import table. Chose to take it wholesale rather than cherry-pick,
since the two implementations model calendar/music data differently enough
(sources+cache vs. flat table; provider objects vs. an adapter registry)
that a partial merge would've meant maintaining two incompatible shapes.

**One deliberate divergence from the branch as-is**: it added
`tauri-plugin-fs` + `fs:allow-read-text-file` to read `.ics` files, and
bumped `keyring` from 3→4. Both reverted — kept `main`'s existing
`read_text_file` custom command (already proven working all session,
avoids re-verifying an fs-plugin ACL configuration untested in this
environment) and `main`'s `keyring = "3"` with explicit
`apple-native`/`windows-native`/`sync-secret-service` features (also
already proven). `Calendar.tsx`'s one `readTextFile()` call site was the
only thing that needed adjusting for this — swapped to
`invoke("read_text_file", {path})`.

### Secure storage: one implementation, not two

Both sessions had independently built a secure-token wrapper — `main` had
`secure_set/get/delete(service, account, value)`
(`src/storage/secureStore.ts`, used only by the now-deleted
`music/adapters.ts`), the parallel branch had `secure_set/get/delete(key)`
(`src/integrations/secureStore.ts` → `src-tauri/src/keychain.rs`, used
throughout `spotify.ts`/`google.ts`). Kept the parallel branch's
simpler key-only version as canonical (everything the merge is bringing in
already calls it consistently) and deleted `main`'s service+account version
entirely, since its only consumer (`adapters.ts`) was itself being
replaced.

### Migration v5 was NOT rewritten

`main`'s migration v5 (`calendar_events`, a flat imported-events table) is
already shipped — an already-numbered migration must never change retroactively,
even in a pre-release app with no real users yet, because that's the habit
that matters once there are. Added **migration v7** instead: drops the now-
unused `calendar_events` table and creates `calendar_sources` +
`calendar_events_cache` (the parallel branch's schema, originally numbered
v5 on its own branch, renumbered to fit after `main`'s v6). Migration v6
(Milestone 6's `widget_instances.style_settings`) is untouched and sits
between the old and new calendar schema.

### Files deleted (superseded)

`src/storage/calendarEvents.ts`, `src/storage/secureStore.ts`,
`src/integrations/music/adapters.ts` (all Session 6's, now fully replaced)
— confirmed via `grep` that nothing else imported them before deleting.

### Files taken wholesale from the parallel branch

`src/integrations/calendar/{types,ics,rrule,dateUtils,icsDate,google}.ts`,
`src/integrations/music/{types,provider,index,spotify,appleMusic,youtube,youtubeMusic}.ts`,
`src/integrations/oauth/pkce.ts`, `src/integrations/secureStore.ts`,
`src/storage/{calendar,music}.ts`, `src/widgets/built-in/Calendar/{Calendar.tsx*,Calendar.css,CalendarViews.tsx}`,
`src/widgets/built-in/Music/{Music.tsx,Music.css}`, `src-tauri/src/{keychain,oauth}.rs`,
`tests/integrations/{ics,rrule}.test.ts`. (*`Calendar.tsx` has the one
`readTextFile` → `invoke` edit described above; everything else is
unmodified from the source branch.)

Notably, **`Calendar.tsx`/`Music.tsx` needed zero changes for Milestone 6
compatibility** — they call `<WidgetFrame title="...">` exactly like every
other widget, and `WidgetFrame`'s chrome-context-driven drag/settings/close
(added in Milestone 6, after this branch was created) is applied
transparently by `WidgetGrid` regardless of what the widget component
itself does. The two milestones' work composed for free.

### Docs

`README.md`/`ROADMAP.md`/`PLAN.md` conflicts resolved by hand to describe
the final integrated state, not either branch's snapshot. `PROGRESS.md`'s
conflict was two full session entries (this file's Session 6 *and* Session
7) against the parallel branch's one Session 6 — kept all of it: retitled
the parallel branch's entry "Session 6 (parallel effort)" so both survive
as accurate history rather than one overwriting the other.

### Build verification

- `npx tsc --noEmit` — clean on the first attempt after resolving every
  conflict (no leftover import mismatches from the file swaps).
- `npx vitest run` — 14/14 passing, including the RRULE `COUNT`/`UNTIL`
  test fix from Session 6's postscript (already on the branch that got
  merged in, so no repeat work needed).
- `cargo check` — failed once with a raw TOML parse error because
  `Cargo.lock`'s conflict markers had been `git add`ed as literal text
  instead of resolved (staging doesn't validate file content) — caught by
  actually running the check rather than assuming staging meant resolved.
  Fixed by deleting `Cargo.lock` and letting `cargo check` regenerate it
  from the resolved `Cargo.toml`; confirmed the regenerated lock pulled
  `keyring v3.6.3` (not v4) and no `tauri-plugin-fs`, matching intent.
- `npm run tauri build -- --debug` — see repo history for this session's
  run.

### Known gaps / deliberately deferred (carried over, still true)

- OAuth flows compile clean but have never been exercised against real
  Spotify/Google accounts by a human — no credentials available in this
  environment. Treat first real use as the actual first test.
- Apple Music, YouTube Music, YouTube now-playing remain unimplemented,
  each with a real documented blocker (see their provider files).
- `.ics` RRULE support excludes `BYDAY`/`BYMONTHDAY`/`BYSETPOS` patterns by
  design (falls back to a single non-recurring occurrence rather than
  guessing) — see `rrule.ts`'s own doc comment.
- No collision/overlap handling in the calendar month grid beyond a "+N"
  indicator.

### Next up

`claude/milestone-5-8d2pih` gets deleted once this lands and is confirmed
on `main` — its work no longer lives only there. Next unclaimed milestone
is 7, the lego-block widget builder. See [ROADMAP.md](ROADMAP.md).

## Session 9 — 2026-08-18 — Milestone 7: block engine execution [CEO-approved]

**Context found at session start**: three commits landed on `main` directly
between this file's Session 8 and tonight (`d0afe0a`, `ed0aced`, `72e2a5b`,
plus a `SPRINT_SUMMARY.md` doc at `1cd10f8`) outside the branch → PR → CI
workflow every prior session used, and without a PROGRESS.md entry. They
added the Settings panel, Focus Mode time picker, global keyboard nav, and
a Block Engine "foundation" (AST types + evaluator + a 22-block standard
library). `npx tsc --noEmit` and `npm run test` were clean on `main` as
pulled, so none of it was left broken — but `SPRINT_SUMMARY.md`'s own
"QA SIGN-OFF: Feature completeness: All requirements met" and "Ready for
beta testing" for the Block Engine were not accurate: `evaluator.ts`'s
`executeBlock` was a literal no-op placeholder (`return { success: true,
value: undefined, outputPortValues: {} }` for every block, unconditionally)
with zero tests. Flagging this rather than quietly fixing it and moving on,
since "ready for beta" claims should be verifiable, not just asserted.
`SPRINT_SUMMARY.md` itself is left as-is (historical record of that
session), not rewritten.

### What was built

Milestone 7's first ROADMAP bullet ("Block engine AST: nodes, edges, port
types, evaluation order") implies blocks actually *evaluate* — they didn't.
This session made `executeBlock` real for all 22 blocks currently
registered in `blockLibrary.ts` (`src/integrations/blockEngine/evaluator.ts`):

- **Display** (`show-text`/`show-number`/`show-image`/`progress-bar`):
  passthrough/normalize, `progress-bar` clamps to 0–100.
- **Logic** (`if-else`/`compare`/`boolean-and`/`boolean-or`): `compare`
  reads its operator (`==`/`!=`/`<`/`>`/`<=`/`>=`) from `BlockNode.config`,
  defaulting to `==`; `if-else` is dataflow-gated (outputs `true`/`false`
  booleans) since the current port schema has no `then`/`else` value
  inputs to route — documented as a known scope gap below, not silently
  redesigned mid-session.
- **Transform** (`format-text`/`math-op`/`date-format`/`join-strings`):
  `format-text` does `{0}`/`{1}`-indexed substitution, `math-op` reads its
  operator from config the same way `compare` does, `date-format` is a
  small hand-rolled `YYYY`/`MM`/`DD`/`HH`/`mm`/`ss` token replacer (no new
  date-library dependency for four tokens).
- **Data** (`get-current-time` is pure — `new Date().toISOString()`;
  `get-now-playing`/`get-note` need live app state).
- **Actions** (`play-sound`/`send-notification`/`open-app`/`set-alarm`)
  and the two non-timer triggers (`on-calendar-event`/`on-music-change`)
  need the OS or SQLite.

For the last two groups, added an `ExecutionBridge` interface
(`types.ts`) — a small set of optional async functions
(`getNowPlaying`/`getNote`/`getNextCalendarEvent`/`playSound`/
`sendNotification`/`openApp`/`setAlarm`) that `ExecutionContext` now
carries and `executeBlock` calls into instead of reaching for Tauri/DB
APIs directly. `evaluateProgram()` takes an optional `bridge` parameter
(defaults to `NULL_BRIDGE = {}`). This keeps `evaluator.ts` itself free of
Tauri imports — it now unit-tests headlessly with plain Vitest, the same
way `rrule.ts`/`ics.ts` do — while still giving those six blocks a real
implementation to run against once something instantiates a bridge. Wrote
that real implementation too, `src/integrations/blockEngine/bridge.ts`
(`liveBridge`), wiring to `storage/notes.ts`, `storage/music.ts`,
`storage/calendar.ts`, `storage/alarms.ts`, and the notification/opener
Tauri plugins already used elsewhere in the app (`GentleReminders.tsx`,
`AppShortcuts.tsx`) — no new plugins added. `liveBridge` isn't wired to
anything yet since there's no block widget renderer to call it from; that
is next up.

Trigger blocks are evaluated as a one-shot pull of current state
(`on-timer` returns `Date.now()`, the other two return the bridge's
current snapshot) rather than a real interval/event push — a real
scheduler belongs to the eventual block widget renderer's runtime loop,
not the AST evaluator, and is out of scope here.

### Tests

New `tests/integrations/blockEngine.test.ts` — 15 tests: `validateProgram`
(missing root, unregistered block, bad port reference, type-mismatched
edge, valid single-node program) and `evaluateProgram` (data→display edge
chaining, progress-bar clamping, compare/and/or with real value
propagation through wired edges — not just default-value paths — math-op,
format-text, join-strings, an action block failing cleanly with no bridge
configured, an action block correctly invoking an injected bridge, and the
invalid-program error path not throwing). Total suite: 29/29 passing (was
14/14 before this session).

### Build verification

- `npx tsc --noEmit` — clean.
- `npm run test` — 29/29 passing.
- `npm run build` (`tsc && vite build`) — succeeds, 295 KB JS bundle.
- `cargo check` (`src-tauri/`) — same standing environment gap as every
  session since 3: this sandbox is missing the Linux GTK/GDK system
  libraries (`gdk-3.0` via pkg-config), so `gdk-sys`'s build script fails
  before reaching any app code. Not run here; the `windows-latest`/
  `macos-latest` CI matrix on the PR is the real check, same as always.

### Known gaps / deliberately deferred

- No visual canvas yet — programs can only be constructed by hand-building
  a `BlockProgram` object (as the tests do). React Flow integration, a
  block palette, and drag/connect UI are all still open — this was
  correctly the single largest remaining item and didn't fit in the same
  session as fixing the evaluator; attempting both would have meant an
  untested canvas sitting on top of an unverified evaluator.
- No block widget renderer — nothing yet runs a `BlockProgram` as a live
  desktop widget or calls `liveBridge` in anger.
- `if-else`'s dataflow-only shape (no `then`/`else` value ports) limits
  what it can actually express; revisit the port schema once the visual
  canvas makes it obvious what real programs need from a branch block.
- Custom block creator (sandboxed JS body editor) and `.nanowidget`
  export/import: not started.
- `liveBridge`'s calendar/music reads are best-effort synchronous
  snapshots of the existing cache tables — inherits every gap already
  documented for Calendar/Music in Milestone 5 (no BYDAY RRULE support,
  three music providers unimplemented, etc.) since it reads the same
  storage those widgets do.

### Next up

Visual canvas (React Flow) is the natural next slice — it's the only way
a person actually builds a block program, and it's what the next session
should spend its budget on rather than starting the block widget renderer
or custom block creator first. See [ROADMAP.md](ROADMAP.md) Milestone 7.

## Session 10 — 2026-08-19 — Milestone 7: visual block canvas [CEO-approved]

**Milestone 7's second bullet ("Visual canvas (React Flow) with premade
block categories") is done.** Built on branch `milestone-7/block-canvas`.
Session 9 made the evaluator real but left blocks constructable only by
hand-writing a `BlockProgram` object; this session gives them an actual
drag-and-drop canvas, which is what a person needs to build one. The two
remaining Milestone 7 items (custom block creator, `.nanowidget` export/
import, block widget renderer) are deliberately left for future sessions —
a reviewable slice, not a rushed whole.

### What was built

- **React Flow canvas** (`@xyflow/react` 12.11.3 — the maintained successor
  to the `reactflow` package). `src/components/blockBuilder/BlockBuilder.tsx`
  is a full-screen overlay opened from a new 🧩 title-bar button or
  `Ctrl+Shift+B`. Palette on the left, canvas in the middle (pan/zoom,
  background grid, zoom controls, minimap), saved-programs list on the right.
- **Palette** (`BlockPalette.tsx`): every registered block from
  `blockLibrary.ts`, grouped by its six categories (Triggers, Display,
  Logic, Data, Actions, Transform). Click-to-add rather than HTML5
  drag-to-add on purpose — a click works with a keyboard and screen reader
  for free, and the added node is immediately draggable on the canvas anyway.
- **Custom node renderer** (`BlockNodeView.tsx`): shows the block's type,
  label, and one labelled handle per input/output port. Handles are
  colour-coded by port type (string/number/boolean/array/any) so a wrong
  wire is visible before you attempt it.
- **Live connection validation**: `isConnectionValid` (in the new pure
  `canvasAdapter.ts`) backs React Flow's `isValidConnection`, so the canvas
  physically refuses an incompatible drop (output→input only, matching port
  types, no self-loops, `any` is a wildcard). An attempted bad connect also
  surfaces a one-line reason in the status bar rather than silently no-op'ing.
- **Persistence**: migration v9 adds a `block_programs` table (name +
  `program_json` blob). `src/storage/blockPrograms.ts` is the CRUD wrapper;
  the builder's Save/load/delete and the saved-programs list use it. New
  programs insert, existing ones update in place.
- **Validate + Run once**: wired to the existing `validateProgram` and
  `evaluateProgram(program, liveBridge)` from session 9 — the canvas isn't a
  separate mock, it runs the same engine the eventual widget renderer will.
  "Set as root" picks which node is evaluated first.
- **`canvasAdapter.ts`** (pure, no React Flow *runtime* import — only its
  type aliases) does `programToFlow`/`flowToProgram` conversions and the
  connection/port-compat logic, so all of it unit-tests headlessly the same
  way `rrule.ts`/`evaluator.ts` do.
- **Bundle**: React Flow is ~230 KB, and the builder is an occasional
  overlay, so it's `React.lazy`-loaded on first open — it lands in its own
  199 KB chunk instead of the startup bundle (main chunk actually shrank
  from 522 KB to 323 KB by splitting it out).

### Bug found and fixed during browser QA

New blocks were being placed only 40px apart, so each added block landed on
top of the previous one and covered its port handles — making them
undraggable until you manually moved the node away (i.e. you couldn't wire
two freshly-added blocks at all). Caught by actually driving the canvas in a
real browser (Playwright, see below), not by type-checking. Fixed by spacing
placement on a 240×160 grid, wider than a node's footprint on both axes.

### Verification

- `npx tsc --noEmit` — clean.
- `npm run test` — 45/45 passing (was 29). Added
  `tests/integrations/canvasAdapter.test.ts` — 16 tests covering
  `portsCompatible`, `programToFlow` (including dropping nodes whose def is
  unregistered, and deriving a missing edge id), `flowToProgram` (round-trip
  fidelity, root-node repointing when the old root is deleted, and *not*
  rewriting the root when the canvas is emptied), and `isConnectionValid`
  (compatible pair accepted; type mismatch, self-loop, unknown handle,
  off-canvas node, and incomplete drag all rejected).
- `npm run build` — succeeds; builder split into its own lazy chunk.
- **Real browser QA (Playwright, standalone Vite):** opened the builder,
  confirmed all 22 palette blocks across 6 categories, added
  `Get Current Time` → `Show Text`, drew a valid string→string edge (created),
  attempted a string→number edge to `Show Number` (correctly refused, edge
  count stayed 1), set root, validated ("Program is valid."), and ran once —
  **got a real ISO timestamp back through the wired blocks**, confirming the
  canvas drives the actual evaluator end to end. Also confirmed node surfaces
  follow the theme engine (Retro dark-green vs. Liquid Glass frosted-light)
  and the keyboard focus ring is present. Screenshot captured. This is the
  first session that could actually click-test its feature — the block
  builder is a pure web overlay with no Tauri-window dependency, so unlike
  the widget grid it drives fine in a plain browser (the only console errors
  are the expected "Tauri IPC not available" ones every widget throws
  outside the real shell).
- `cargo check` (`src-tauri/`) — same standing environment gap as every
  session since 3: this sandbox lacks the Linux GTK/GDK system libraries
  (`gdk-3.0` via pkg-config), so `gdk-sys`'s build script fails before
  reaching any app code. Migration v9 is a single additive `CREATE TABLE`,
  the same shape as the eight before it. The `windows-latest`/`macos-latest`
  CI matrix on the PR is the real check.

### CI was already red on main — fixed here

The PR's `frontend-check` failed on the first run, and checking main showed
its last four runs (including current HEAD `fa09723`) were **already red**
for the same reason — a pre-existing environmental break, not something this
PR introduced. Root cause: the CI pins Node 20 (`setup-node`), but the
`undici` 8.10.0 bundled by `jsdom` 30 calls `webidl.util.markAsUncloneable`,
a Node API that only exists on Node 22+. On Node 20 that throws while jsdom
loads, so *every* test file fails to start ("no tests, 7 errors") — which is
why the suite passed locally (Node 22 here) but died in CI. GitHub was also
already warning that Node 20 is being deprecated on its runners. Fixed by
bumping both CI jobs to `node-version: 22` (current LTS). This is the minimal
fix the failure needs and it heals `main` too once merged.

### Accessibility

- Palette items, canvas controls, and toolbar are all real `<button>`s —
  keyboard-reachable, and they inherit the global `:focus-visible` ring from
  `base.css` (confirmed via Tab in the browser).
- The status line's success/error state is signalled by a coloured
  left-border rule with the text kept on the theme's own `--nb-text` token,
  rather than tinting the text green/red — coloured status text would fail
  WCAG contrast on the light themes (Liquid Glass, Glossy).
- The canvas surfaces (background, node fills, controls, minimap) are pinned
  to `--nb-*` tokens so the builder respects the active theme instead of
  React Flow's built-in light palette.

### Known gaps / deliberately deferred

- **Block widget renderer** — a saved program still can't be dropped onto
  the desktop as a live widget. This is the natural next slice: a widget
  type that loads a `block_programs` row and runs it on an interval via
  `liveBridge`.
- **Custom block creator** (sandboxed JS body editor) and **`.nanowidget`
  export/import** — not started; the other two open Milestone 7 items.
- No per-node config editor yet — blocks that read `config` (`compare`'s
  operator, `math-op`'s operator, `on-timer`'s interval) use their defaults
  on the canvas. Wiring a small per-node inspector is a follow-up.
- No block *deletion* affordance beyond React Flow's built-in select +
  Backspace; no undo/redo.
- The engine's own session-9 gaps are unchanged (e.g. `if-else` is
  dataflow-only, trigger blocks pull a one-shot snapshot).

### Next up

Block widget renderer — run a saved `BlockProgram` as a live desktop widget
calling `liveBridge`, closing the loop from "build a program" to "use it."
Then the custom block creator and `.nanowidget` export/import. See
[ROADMAP.md](ROADMAP.md) Milestone 7.
