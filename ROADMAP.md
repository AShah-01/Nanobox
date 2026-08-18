# Nanobox — Roadmap

Milestones are the unit of "done, builds cleanly on Windows + macOS, safe to
move on." Each milestone lists numbered tasks; the CEO agent works through
them in order and does not start the next milestone until the current one's
app builds cleanly on both platforms (see [PLAN.md](PLAN.md)).

## Milestone 1 — Foundation shell

1. Scaffold Tauri 2 + React + TypeScript project, matching the folder
   structure in `PRODUCT_SPEC.md` (`src/core`, `src/widgets`, `src/themes`,
   `src/tokens`, `src/components`, `src/integrations`, `src/storage`,
   `src-tauri`, `tests`, `public/fonts`)
2. App shell: system tray icon (show/hide toggle, quit), desktop overlay
   window (transparent, sits above wallpaper below other windows), runs on
   startup (Windows registry Run key / macOS launchd agent)
3. SQLite storage layer via `tauri-plugin-sql`: initial schema with an empty
   `notes` table, migration wired into `src/storage`
4. Render one hardcoded Clock widget in `src/widgets/built-in` so there's a
   visible widget on screen
5. GitHub Actions CI: build matrix for `windows-latest` and `macos-latest`,
   confirms the app builds cleanly on both before Milestone 2 starts

## Milestone 2 — Core widgets ✅

- [x] Notes widget: create, edit, delete, pin, colour label (SQLite-backed)
- [x] Alarm widget: list view, time picker, sound picker, day-of-week toggles, snooze
- [x] App Shortcuts widget: drag-in icons, launch on click, editable labels
- [x] Countdown widget: timer counting down to a date
- [x] Habit Tracker widget: daily checkbox habits with streak counter
- [x] Focus Mode widget: Pomodoro-style timer, optionally hides other widgets
- [x] Widget grid system: 8px snapping, resize handles, per-widget opacity slider

See [PROGRESS.md](PROGRESS.md) session 2 for implementation notes and known gaps.

## Milestone 3 — Theme engine (in progress)

- [x] CSS custom property token pipeline (`--nb-surface`, `--nb-text`,
      `--nb-accent`, `--nb-border-style`, `--nb-radius`, `--nb-font-family`,
      plus `--nb-accent-text` added this session — see PROGRESS.md session 3)
- [x] All six themes: Liquid Glass, Matte, Glossy, Retro, Cyberpunk, Steampunk
- [x] Hot-swappable theme switching (no reload), minimal theme switcher UI
- [x] Accessibility baseline: WCAG AA contrast on every theme, `:focus-visible`
      rings, `prefers-reduced-motion` support
- [ ] Per-theme user customisation: colour picker, opacity, font family/scale,
      corner radius, border style; export/import as `.nanotheme`
- [ ] Colour-blindness simulation checks

See [PROGRESS.md](PROGRESS.md) session 3 for implementation notes and what's
left before this milestone is fully done.

## Milestone 4 — Everyday ADHD/neurodivergent toolkit widgets ✅ (core set)

Added after Milestone 3, pushing the original Milestone 4–6 down one slot
each (now 5–7). Scoped from researching what ADHD/neurodivergent people
actually reach for daily — Tiimo, Time Timer, Goblin.tools' Magic ToDo,
Finch, Sprout — then simplified to fit the local-first, no-account,
no-AI-dependency shape Nanobox already has. Explicitly cut: Focusmate-style
live body-doubling (needs a real-time matching/presence backend — out of
scope for a single-user local app; revisit if/when cloud sync ever happens,
see `PRODUCT_SPEC.md` open questions).

- [x] Visual Timer widget: Time Timer-style shrinking colour disk/arc for a
  chosen duration — readable at a glance without reading digits (the
  single most common time-blindness aid across every app researched)
- [x] Today Timeline widget: Tiimo-inspired vertical strip of today's time
  blocks, icon + colour per block, current-time indicator line — manually
  entered for now, becomes calendar-fed once Milestone 5 lands
- [x] Brain Dump widget: near-zero-friction single-line capture — type, hit
  Enter, done. Deliberately lighter-weight than the Notes widget's
  title/body/colour flow; addresses "capture it before you lose it"
- [x] Task Breakdown widget: Goblin.tools' Magic ToDo, simplified to skip the
  AI call — write one big/vague task as a header, add sub-steps as
  checkboxes underneath by hand, check off as you go
- [x] Mood Check-in widget: single-tap emoji + optional short note, once a
  day, small 7-day history strip
- [x] Gentle Reminders widget: Sprout/Finch-style interval nudges ("stand up
  every 45 min", "drink water") — runs on a repeating interval rather than
  a clock time, so it's a distinct mechanic from the Alarm widget
- [ ] Companion widget (stretch — cut this session, see PROGRESS.md session 4):
  a small plant/creature that visibly grows from existing Habit Tracker
  streak data (`habits`/`habit_logs`) — Finch-inspired, purely a cosmetic
  read of data that already exists, no new mechanics required

See [PROGRESS.md](PROGRESS.md) session 4 for implementation notes.

Also delivered this session, outside the original scope above (direct user
request): a draggable title bar (the borderless overlay had no way to be
repositioned — real bug, not a nice-to-have) and an MVP Custom Widget type
(sandboxed iframe, dev-authored HTML/CSS/JS) as an early precursor to
Milestone 6's full block engine. See PROGRESS.md session 5.

## Milestone 5 — Integrations ✅

Started as two parallel efforts that collided (see PROGRESS.md session 6's
postscript) — a local-first-only session and a separate, more complete
attempt with real OAuth. Reconciled in session 8: the complete version's
Calendar/Music implementation was integrated onto `main`, replacing the
local-first-only one.

- [x] Secure token storage: OS-native keychain (Windows Credential Manager /
      macOS Keychain / Linux Secret Service) via the `keyring` Rust crate,
      exposed as Tauri commands (`src-tauri/src/keychain.rs`) — tokens never
      touch SQLite or a plaintext file
- [x] Calendar widget: local `.ics` parsing (RFC 5545 line-unfolding, VEVENT
      fields, a supported RRULE subset — see `src/integrations/calendar/rrule.ts`)
      + Google Calendar (OAuth 2.0 PKCE, read-only), unified `CalendarEvent`
      interface, month/week/day views, multiple sources at once
- [x] Music widget: unified `NowPlayingData` interface + pluggable provider
      architecture; Spotify implemented (OAuth PKCE, polling
      `/me/player/currently-playing` rather than the heavier Web Playback
      SDK — see PROGRESS.md session 8 for why); Apple Music, YouTube Music,
      and YouTube deliberately **not** implemented — each has a real
      blocker, documented at the top of its provider file
      (`src/integrations/music/{appleMusic,youtubeMusic,youtube}.ts`)
- [x] Graceful degradation: both widgets cache last-known-good data (SQLite:
      `calendar_events_cache`, `app_settings` for now-playing) and fall back
      to it with a visible "offline" indicator when a live fetch fails
- [ ] Apple Music, YouTube Music, YouTube now-playing — blocked on the
      reasons above; revisit if/when a plausible mechanism exists
- [ ] OAuth flows are implemented and compile clean, but **have not been
      exercised against real Spotify/Google accounts** by a human yet (no
      credentials available in this environment) — first real use should be
      treated as the actual first test, not as "already verified"

## Milestone 6 — Window chrome & widget UX fixes ✅ (pending real-world drag confirmation)

Direct user bug report after using the app for real: several things from
Milestones 1/2/4 didn't actually work as intended once someone tried to
live with it day to day. Pushes the former Milestone 6/7 (Lego block
builder, Polish & release) down to 7/8.

- [x] Window has no minimize/maximize/close controls — only a single
      "hide" button existed
- [x] Window dragging (added Milestone 4) doesn't reliably work in
      practice — likely conflicts with `dragDropEnabled` (needed for App
      Shortcuts' file drop), which intercepts the same mouse gesture the
      passive `data-tauri-drag-region` attribute relies on; switched to
      the explicit `startDragging()` API on the title bar. Compiles and
      type-checks; **not yet confirmed fixed by an actual human dragging
      the window** — no way to click-test that in this environment. Please
      confirm after this ships.
- [x] `skipTaskbar: true` means the app never appears in the taskbar at
      all, contradicting "an app that sits in your taskbar" — cleared
- [x] Clarified (docs, not a code bug): `npm run tauri dev` is inherently
      tied to its terminal by design (it's a dev server) — the persistent,
      terminal-independent, tray/taskbar experience already exists via the
      built installer (now downloadable from CI, see README)
- [x] Custom Widget: no title field, code only lives in SQLite — added a
      title input and each widget now also saves as a `.nanowidget.json`
      file in a dedicated app-data folder, not just the database
- [x] WidgetGrid's floating "6-dot" drag handle removed — dragging now
      happens by grabbing the widget's own visible title bar; a close (×)
      and settings (⚙) button live on that same bar
- [x] Per-widget settings expand beyond Opacity to include Color (pick one
      colour, the widget derives a shade palette from it — that colour
      becomes the widget's accent) and Style (border presets: none /
      hairline / thick / engraved, per `PRODUCT_SPEC.md`'s theme-engine
      vocabulary, now available per-widget-instance too)

See [PROGRESS.md](PROGRESS.md) session 7 for root-cause detail on the
drag/taskbar bugs and what's still unverified.

## Milestone 7 — Lego block widget builder

An MVP precursor already exists: the Custom Widget type (added Milestone 4,
see PROGRESS.md session 5) lets developers drop sandboxed HTML/CSS/JS
straight onto the desktop via `src/widgets/built-in/CustomWidget`. It's a
real but narrower security boundary (iframe `sandbox="allow-scripts"`, no
`allow-same-origin` — isolated from the app, but not from the network) and
has no visual block editor, no typed ports, no block library. This
milestone replaces it with the actual designed system:

- [x] Block engine AST: nodes, edges, port types, evaluation order
      (`src/integrations/blockEngine/types.ts`, `evaluator.ts`) — includes
      real per-block execution (all 22 registered blocks in
      `blockLibrary.ts` now do something; see PROGRESS.md session 9),
      not just the AST shape
- [ ] Visual canvas (React Flow) with premade block categories: Data, Display,
  Logic, Sound, Interaction
- [ ] Custom block creator: named inputs (text/number/colour/boolean) + sandboxed
  JS body editor (Compartment/ShadowRealm — no `window`/`document`/`fetch`/
  Tauri API access; all external calls via a whitelisted bridge API)
- [ ] Widget export/import as `.nanowidget` (JSON schema + base64 block code)
- [ ] Block widget renderer: run a block program as a live desktop widget

See [PROGRESS.md](PROGRESS.md) session 9 for what's implemented vs. still
missing before this milestone is usable end-to-end.

## Milestone 8 — Polish & release

- First-run onboarding wizard: theme picker, accent colour, add first widget
- Full keyboard navigation across all widgets and settings
- High contrast mode across all six themes
- Windows packaging (MSIX/NSIS) and macOS packaging (DMG, code signing)
- Documentation site: Getting Started, Widget Reference, Block Engine Guide
- Public release: README overhaul with demo GIF, one-command install
