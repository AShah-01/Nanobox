import { createContext, useContext } from "react";

export interface WidgetChrome {
  onDragStart: (e: React.PointerEvent) => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

/**
 * Lets WidgetFrame's own title bar act as the drag handle and host the
 * close/settings buttons, without threading drag/close/settings callbacks
 * as props through every individual widget component (Notes, Alarm, ...) —
 * WidgetGrid owns that state and provides it once per cell; WidgetFrame
 * just reads it if present.
 */
export const WidgetChromeContext = createContext<WidgetChrome | null>(null);

export function useWidgetChrome(): WidgetChrome | null {
  return useContext(WidgetChromeContext);
}
