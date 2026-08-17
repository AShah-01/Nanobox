# Nanobox — Plan

This file tracks the living execution plan for Nanobox. For the full product
vision and feature spec, see the private planning docs (not in this repo).
For milestone-by-milestone build order, see [ROADMAP.md](ROADMAP.md).
For a session-by-session log of what's been built, see [PROGRESS.md](PROGRESS.md).

## Current focus

**Milestones 1–6 are done.** Foundation shell, core widgets, theme engine,
everyday toolkit widgets, Calendar + Music integrations (including real
Google Calendar/Spotify OAuth), and a window-chrome/widget-UX overhaul are
all shipped on `main`. A few individual checkboxes remain open within
otherwise-complete milestones (per-theme customisation UI, colour-blindness
checks, the Companion widget, Apple Music/YouTube Music/YouTube) — see
[ROADMAP.md](ROADMAP.md) for exactly which. Next unclaimed milestone is 7,
the lego-block widget builder.

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
- Before starting a milestone, check `ROADMAP.md`/`PROGRESS.md` for whether
  it's already claimed by another in-flight session — two agents built
  Milestone 5 independently and in parallel once (see PROGRESS.md session
  6's postscript); avoid repeating that.

## Milestones at a glance

See [ROADMAP.md](ROADMAP.md) for the full breakdown. Short version:

1. **Foundation shell** — scaffold, tray, overlay window, autostart, SQLite, Clock widget ✅
2. **Core widgets** — Notes, Alarm, App Shortcuts, Countdown, Habit Tracker, Focus mode ✅
3. **Theme engine** — all six themes, token pipeline, accessibility baseline ✅ (per-theme customisation + colour-blindness checks still open)
4. **Everyday toolkit widgets** — Visual Timer, Today Timeline, Brain Dump, Task Breakdown, Mood Check-in, Gentle Reminders, (stretch) Companion — core set done, Companion still open
5. **Integrations** — Calendar (local .ics + Google Calendar OAuth) and Music (unified now-playing, Spotify wired up via OAuth PKCE) ✅ (Apple Music/YouTube Music/YouTube each blocked on a real, documented constraint)
6. **Window chrome & widget UX fixes** — real window controls, working drag, taskbar presence, per-widget colour/style settings ✅
7. **Lego block widget builder** — visual programming canvas + sandboxed custom blocks
8. **Polish & release** — packaging (MSIX/DMG), onboarding, docs site, public release
