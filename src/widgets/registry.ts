import { ComponentType } from "react";
import {
  Alarm,
  AppShortcuts,
  BrainDump,
  Calendar,
  Clock,
  Countdown,
  FocusMode,
  GentleReminders,
  HabitTracker,
  MoodCheckIn,
  Music,
  Notes,
  TaskBreakdown,
  TodayTimeline,
  VisualTimer,
} from "./built-in";

export type WidgetId =
  | "clock"
  | "notes"
  | "alarm"
  | "shortcuts"
  | "countdown"
  | "habit-tracker"
  | "focus-mode"
  | "visual-timer"
  | "today-timeline"
  | "brain-dump"
  | "task-breakdown"
  | "mood-check-in"
  | "gentle-reminders"
  | "calendar"
  | "music"
  | "custom"
  | "block-widget";

/**
 * "custom" and "block-widget" are deliberately excluded here — unlike every
 * other widget, each needs its own `WidgetInstance` (for the per-instance
 * code, or the chosen block program id, in `settings`), so `WidgetGrid`
 * renders them directly instead of through this no-props map. They're still
 * normal entries in `WIDGET_LABELS` / `DEFAULT_SIZE` so they show up in the
 * add-widget menu like everything else.
 */
export const WIDGET_REGISTRY: Record<Exclude<WidgetId, "custom" | "block-widget">, ComponentType> = {
  clock: Clock,
  notes: Notes,
  alarm: Alarm,
  shortcuts: AppShortcuts,
  countdown: Countdown,
  "habit-tracker": HabitTracker,
  "focus-mode": FocusMode,
  "visual-timer": VisualTimer,
  "today-timeline": TodayTimeline,
  "brain-dump": BrainDump,
  "task-breakdown": TaskBreakdown,
  "mood-check-in": MoodCheckIn,
  "gentle-reminders": GentleReminders,
  calendar: Calendar,
  music: Music,
};

export const WIDGET_LABELS: Record<WidgetId, string> = {
  clock: "Clock",
  notes: "Notes",
  alarm: "Alarms",
  shortcuts: "Shortcuts",
  countdown: "Countdown",
  "habit-tracker": "Habits",
  "focus-mode": "Focus Mode",
  "visual-timer": "Visual Timer",
  "today-timeline": "Today",
  "brain-dump": "Brain Dump",
  "task-breakdown": "Task Breakdown",
  "mood-check-in": "Mood Check-in",
  "gentle-reminders": "Gentle Reminders",
  calendar: "Calendar",
  music: "Music",
  custom: "Custom Widget (developer)",
  "block-widget": "Block Widget",
};

export const DEFAULT_SIZE: Record<WidgetId, { w: number; h: number }> = {
  clock: { w: 240, h: 128 },
  notes: { w: 280, h: 320 },
  alarm: { w: 280, h: 320 },
  shortcuts: { w: 260, h: 200 },
  countdown: { w: 260, h: 240 },
  "habit-tracker": { w: 260, h: 280 },
  "focus-mode": { w: 240, h: 260 },
  "visual-timer": { w: 240, h: 320 },
  "today-timeline": { w: 280, h: 300 },
  "brain-dump": { w: 260, h: 280 },
  "task-breakdown": { w: 280, h: 320 },
  "mood-check-in": { w: 260, h: 220 },
  "gentle-reminders": { w: 260, h: 280 },
  calendar: { w: 380, h: 380 },
  music: { w: 280, h: 240 },
  custom: { w: 300, h: 280 },
  "block-widget": { w: 260, h: 220 },
};
