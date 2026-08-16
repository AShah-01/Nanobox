# Nanobox — Plan

This file tracks the living execution plan for Nanobox. For the full product
vision and feature spec, see the private planning docs (not in this repo).
For milestone-by-milestone build order, see [ROADMAP.md](ROADMAP.md).
For a session-by-session log of what's been built, see [PROGRESS.md](PROGRESS.md).

## Current focus

**Milestone 1 — Foundation shell.** Get a Tauri 2 + React + TypeScript app
that boots to a desktop overlay, lives in the system tray, starts on login,
persists data to a local SQLite database, and renders a first real widget
(Clock). This has to build cleanly on both Windows and macOS before any
widget/theme/integration work starts.

## Working agreement

- Ship in small, reviewable increments — one milestone's worth of tasks at a
  time, not the whole roadmap in one pass.
- Every milestone must build cleanly on **both** Windows and macOS before the
  next one starts (checked via GitHub Actions CI matrix, since day-to-day
  development happens on a single OS).
- Commit messages describe the "why," follow Conventional Commits
  (`feat:`, `fix:`, `chore:`, ...), and are tagged `[CEO-approved]` when
  written by the CEO agent integrating a batch of work.
- Prefer editing/extending the folder structure defined in the product spec
  over inventing new top-level directories.

## Milestones at a glance

See [ROADMAP.md](ROADMAP.md) for the full breakdown. Short version:

1. **Foundation shell** — scaffold, tray, overlay window, autostart, SQLite, Clock widget
2. **Core widgets** — Notes, Alarm, App Shortcuts, Countdown, Habit Tracker, Focus mode
3. **Theme engine** — all six themes, token pipeline, accessibility baseline
4. **Integrations** — Calendar (Google/iCal) and Music (Spotify/Apple Music/YouTube)
5. **Lego block widget builder** — visual programming canvas + sandboxed custom blocks
6. **Polish & release** — packaging (MSIX/DMG), onboarding, docs site, public release
