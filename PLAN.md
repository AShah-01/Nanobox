# Nanobox — Plan

This file tracks the living execution plan for Nanobox. For the full product
vision and feature spec, see the private planning docs (not in this repo).
For milestone-by-milestone build order, see [ROADMAP.md](ROADMAP.md).
For a session-by-session log of what's been built, see [PROGRESS.md](PROGRESS.md).

## Current focus

**Milestone 5 — Integrations.** Milestones 1–4 (foundation shell, core
widgets, theme engine, everyday toolkit widgets) are done. Milestone 5 adds
the Calendar widget (local `.ics` + Google Calendar) and Music widget
(unified now-playing across streaming services), backed by a new OS-keychain
secure token store. Spotify is the one music provider actually wired up this
session — Apple Music, YouTube Music, and YouTube each have a real,
documented blocker rather than a half-working integration. See
[ROADMAP.md](ROADMAP.md) for what's done vs. deferred.

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

1. **Foundation shell** — scaffold, tray, overlay window, autostart, SQLite, Clock widget ✅
2. **Core widgets** — Notes, Alarm, App Shortcuts, Countdown, Habit Tracker, Focus mode ✅
3. **Theme engine** — all six themes, token pipeline, accessibility baseline ✅ (per-theme customisation + colour-blindness checks still open)
4. **Everyday toolkit widgets** — Visual Timer, Today Timeline, Brain Dump, Task Breakdown, Mood Check-in, Gentle Reminders, (stretch) Companion — core set done, Companion still open
5. **Integrations** — Calendar (Google/iCal) done, Music done for Spotify only (Apple Music/YouTube Music/YouTube blocked, see ROADMAP.md) — in progress
6. **Lego block widget builder** — visual programming canvas + sandboxed custom blocks
7. **Polish & release** — packaging (MSIX/DMG), onboarding, docs site, public release
