import { ComponentType } from "react";
import { Alarm, AppShortcuts, Clock, Countdown, FocusMode, HabitTracker, Notes } from "./built-in";

export type WidgetId = "clock" | "notes" | "alarm" | "shortcuts" | "countdown" | "habit-tracker" | "focus-mode";

export const WIDGET_REGISTRY: Record<WidgetId, ComponentType> = {
  clock: Clock,
  notes: Notes,
  alarm: Alarm,
  shortcuts: AppShortcuts,
  countdown: Countdown,
  "habit-tracker": HabitTracker,
  "focus-mode": FocusMode,
};

export const WIDGET_LABELS: Record<WidgetId, string> = {
  clock: "Clock",
  notes: "Notes",
  alarm: "Alarms",
  shortcuts: "Shortcuts",
  countdown: "Countdown",
  "habit-tracker": "Habits",
  "focus-mode": "Focus Mode",
};

export const DEFAULT_SIZE: Record<WidgetId, { w: number; h: number }> = {
  clock: { w: 240, h: 128 },
  notes: { w: 280, h: 320 },
  alarm: { w: 280, h: 320 },
  shortcuts: { w: 260, h: 200 },
  countdown: { w: 260, h: 240 },
  "habit-tracker": { w: 260, h: 280 },
  "focus-mode": { w: 240, h: 260 },
};
