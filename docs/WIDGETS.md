# Widget Reference

Every widget below is added the same way: click **+ Add widget** on the overlay,
pick it from the menu, then drag/resize like any other widget. Each one gets
its own opacity slider and colour override via the widget's settings popover
(the gear icon that appears on hover).

| Widget | ID | What it does |
|---|---|---|
| Clock | `clock` | Analogue/digital clock, timezone support. |
| Notes | `notes` | Create, edit, delete, pin, and colour-label sticky notes. |
| Alarms | `alarm` | Recurring alarms with day-of-week toggles, snooze, and a sound picker (Chime/Beep/Digital) with live preview. |
| Shortcuts | `shortcuts` | Drag app icons in, launch on click, editable labels. |
| Countdown | `countdown` | Counts down to a target date/time. |
| Habits | `habit-tracker` | Daily habit tracking with streaks. |
| Focus Mode | `focus-mode` | Pomodoro-style work/break timer. Work and break lengths are adjustable via a wheel picker (drag, scroll, or type a number directly) — click the gear icon on the widget. Notification sound is also configurable there. |
| Visual Timer | `visual-timer` | A visual (non-numeric) countdown, useful for time-blindness. |
| Today | `today-timeline` | A timeline view of today's events/tasks. |
| Brain Dump | `brain-dump` | Freeform capture for unstructured thoughts. |
| Task Breakdown | `task-breakdown` | Splits a task into smaller steps. |
| Mood Check-in | `mood-check-in` | Quick mood logging. |
| Gentle Reminders | `gentle-reminders` | Non-intrusive reminder prompts. |
| Calendar | `calendar` | Month/week/day views. Sources: import an `.ics` file, connect Google Calendar (read-only OAuth), or use **+ Event** to quick-add a one-off event stored locally — no external source needed. |
| Music | `music` | Now-playing widget for Spotify / Apple Music / YouTube Music. |
| Custom Widget | `custom` | Write your own HTML/CSS/JS, sandboxed in an iframe with no access to Nanobox's data or Tauri APIs. See the Block Engine Guide for the higher-level visual alternative. |

## App-wide settings

Beyond individual widgets, the **Settings** panel (gear icon in the title bar)
controls:

- Theme (all 6: Liquid Glass, Matte, Glossy, Retro, Cyberpunk, Steampunk)
- Accent colour
- Font size / window opacity
- Launch on startup
- **High contrast mode** — strips decorative overlays (scanlines, glow,
  texture) and raises muted-text/border contrast on top of whichever theme
  is active, rather than being a separate theme
- Default notification sound (used as the initial pick for new alarms and
  for Focus Mode until you override it there)

First launch shows a short onboarding wizard (theme, accent colour, first
widget) — skippable, and re-run only happens if you never completed it.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+,` | Toggle the Settings panel |
| `Ctrl+Shift+A` | Toggle the "+ Add widget" menu |
| `Ctrl+Shift+T` | Cycle to the next theme |
| `Tab` / `Shift+Tab` | Move focus between controls (visible focus ring) |
| `Escape` | Close whichever modal/popover is open |

Within the Focus Mode time picker specifically: arrow keys nudge the value
by one minute, `Enter` switches to typing a number directly, `Escape`
cancels the edit.

## Where widget code lives

```
src/widgets/built-in/<WidgetName>/<WidgetName>.tsx
```

Each widget is a self-contained React component wrapped in `<WidgetFrame>`.
Registration happens in `src/widgets/registry.ts` — that's the single file
that maps a `WidgetId` to its component, display label, and default
width/height.
