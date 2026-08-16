import { ComponentType } from "react";
import { Clock } from "./built-in";

export type WidgetId = "clock";

/**
 * Minimal widget registry. Milestone 1 hardcodes a single Clock instance;
 * Milestone 2 replaces this with persisted layout (position/size per widget
 * instance, loaded from src/storage) and the full add/remove/configure flow.
 */
export const WIDGET_REGISTRY: Record<WidgetId, ComponentType> = {
  clock: Clock,
};
