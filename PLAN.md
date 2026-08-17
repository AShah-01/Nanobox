# Nanobox — Plan

This file tracks the living execution plan for Nanobox. For the full product
vision and feature spec, see the private planning docs (not in this repo).
For milestone-by-milestone build order, see [ROADMAP.md](ROADMAP.md).
For a session-by-session log of what's been built, see [PROGRESS.md](PROGRESS.md).

## Current focus

**Milestone 4 — Everyday ADHD/neurodivergent toolkit widgets.** Milestones
1–3 (foundation shell, core widgets, theme engine) are done. Milestone 4 adds
a second wave of widgets researched from what ADHD/neurodivergent people
actually use daily (Tiimo, Time Timer, Goblin.tools, Finch, Sprout),
simplified to fit Nanobox's local-first, no-account shape. See
[ROADMAP.md](ROADMAP.md) for the widget list and what got deliberately cut.

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
4. **Everyday toolkit widgets** — Visual Timer, Today Timeline, Brain Dump, Task Breakdown, Mood Check-in, Gentle Reminders, (stretch) Companion — in progress
5. **Integrations** — Calendar (Google/iCal) and Music (Spotify/Apple Music/YouTube)
6. **Lego block widget builder** — visual programming canvas + sandboxed custom blocks
7. **Polish & release** — packaging (MSIX/DMG), onboarding, docs site, public release
