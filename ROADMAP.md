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

## Milestone 2 — Core widgets

- Notes widget: create, edit, delete, pin, colour label (SQLite-backed)
- Alarm widget: list view, time picker, sound picker, day-of-week toggles, snooze
- App Shortcuts widget: drag-in icons, launch on click, editable labels
- Countdown widget: timer counting down to a date
- Habit Tracker widget: daily checkbox habits with streak counter
- Focus Mode widget: Pomodoro-style timer, optionally hides other widgets
- Widget grid system: 8px snapping, resize handles, per-widget opacity slider

## Milestone 3 — Theme engine

- CSS custom property token pipeline (`--nb-surface`, `--nb-text`,
  `--nb-accent`, `--nb-border-style`, `--nb-radius`, `--nb-font-family`)
- All six themes: Liquid Glass, Matte, Glossy, Retro, Cyberpunk, Steampunk
- Hot-swappable theme switching (no reload)
- Per-theme user customisation: colour picker, opacity, font family/scale,
  corner radius, border style; export/import as `.nanotheme`
- Accessibility baseline: WCAG AA contrast on every theme, `:focus-visible`
  rings, `prefers-reduced-motion` support, colour-blindness simulation checks

## Milestone 4 — Integrations

- Calendar widget: Google Calendar (OAuth, read-only) + local `.ics` parsing,
  unified `CalendarEvent` interface, month/week/day views
- Music widget: unified `NowPlayingData` interface across Spotify (OAuth PKCE
  + Web Playback SDK), Apple Music (MusicKit JS), YouTube Music (Odesli
  polling), YouTube (Data API v3)
- Secure token storage via Tauri's OS keychain integration (never SQLite,
  never plaintext)
- Graceful degradation: cached last-known state when an integration is down

## Milestone 5 — Lego block widget builder

- Block engine AST: nodes, edges, port types, evaluation order
- Visual canvas (React Flow) with premade block categories: Data, Display,
  Logic, Sound, Interaction
- Custom block creator: named inputs (text/number/colour/boolean) + sandboxed
  JS body editor (Compartment/ShadowRealm — no `window`/`document`/`fetch`/
  Tauri API access; all external calls via a whitelisted bridge API)
- Widget export/import as `.nanowidget` (JSON schema + base64 block code)
- Block widget renderer: run a block program as a live desktop widget

## Milestone 6 — Polish & release

- First-run onboarding wizard: theme picker, accent colour, add first widget
- Full keyboard navigation across all widgets and settings
- High contrast mode across all six themes
- Windows packaging (MSIX/NSIS) and macOS packaging (DMG, code signing)
- Documentation site: Getting Started, Widget Reference, Block Engine Guide
- Public release: README overhaul with demo GIF, one-command install
