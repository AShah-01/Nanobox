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

## Milestone 4 — Everyday ADHD/neurodivergent toolkit widgets

Added after Milestone 3, pushing the original Milestone 4–6 down one slot
each (now 5–7). Scoped from researching what ADHD/neurodivergent people
actually reach for daily — Tiimo, Time Timer, Goblin.tools' Magic ToDo,
Finch, Sprout — then simplified to fit the local-first, no-account,
no-AI-dependency shape Nanobox already has. Explicitly cut: Focusmate-style
live body-doubling (needs a real-time matching/presence backend — out of
scope for a single-user local app; revisit if/when cloud sync ever happens,
see `PRODUCT_SPEC.md` open questions).

- Visual Timer widget: Time Timer-style shrinking colour disk/arc for a
  chosen duration — readable at a glance without reading digits (the
  single most common time-blindness aid across every app researched)
- Today Timeline widget: Tiimo-inspired vertical strip of today's time
  blocks, icon + colour per block, current-time indicator line — manually
  entered for now, becomes calendar-fed once Milestone 5 lands
- Brain Dump widget: near-zero-friction single-line capture — type, hit
  Enter, done. Deliberately lighter-weight than the Notes widget's
  title/body/colour flow; addresses "capture it before you lose it"
- Task Breakdown widget: Goblin.tools' Magic ToDo, simplified to skip the
  AI call — write one big/vague task as a header, add sub-steps as
  checkboxes underneath by hand, check off as you go
- Mood Check-in widget: single-tap emoji + optional short note, once a day,
  small 7-day history strip
- Gentle Reminders widget: Sprout/Finch-style interval nudges ("stand up
  every 45 min", "drink water") — runs on a repeating interval rather than
  a clock time, so it's a distinct mechanic from the Alarm widget
- Companion widget (stretch — cut first if the milestone runs long): a
  small plant/creature that visibly grows from existing Habit Tracker
  streak data (`habits`/`habit_logs`) — Finch-inspired, purely a cosmetic
  read of data that already exists, no new mechanics required

## Milestone 5 — Integrations

- Calendar widget: Google Calendar (OAuth, read-only) + local `.ics` parsing,
  unified `CalendarEvent` interface, month/week/day views
- Music widget: unified `NowPlayingData` interface across Spotify (OAuth PKCE
  + Web Playback SDK), Apple Music (MusicKit JS), YouTube Music (Odesli
  polling), YouTube (Data API v3)
- Secure token storage via Tauri's OS keychain integration (never SQLite,
  never plaintext)
- Graceful degradation: cached last-known state when an integration is down

## Milestone 6 — Lego block widget builder

- Block engine AST: nodes, edges, port types, evaluation order
- Visual canvas (React Flow) with premade block categories: Data, Display,
  Logic, Sound, Interaction
- Custom block creator: named inputs (text/number/colour/boolean) + sandboxed
  JS body editor (Compartment/ShadowRealm — no `window`/`document`/`fetch`/
  Tauri API access; all external calls via a whitelisted bridge API)
- Widget export/import as `.nanowidget` (JSON schema + base64 block code)
- Block widget renderer: run a block program as a live desktop widget

## Milestone 7 — Polish & release

- First-run onboarding wizard: theme picker, accent colour, add first widget
- Full keyboard navigation across all widgets and settings
- High contrast mode across all six themes
- Windows packaging (MSIX/NSIS) and macOS packaging (DMG, code signing)
- Documentation site: Getting Started, Widget Reference, Block Engine Guide
- Public release: README overhaul with demo GIF, one-command install
