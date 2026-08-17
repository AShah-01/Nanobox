import { PropsWithChildren } from "react";
import { useWidgetChrome } from "../widgets/WidgetChromeContext";
import "./WidgetFrame.css";

interface WidgetFrameProps extends PropsWithChildren {
  title?: string;
}

/**
 * Shared chrome every built-in and custom widget renders inside. When
 * rendered inside WidgetGrid (the normal case), the title bar doubles as
 * the drag handle and hosts the settings (⚙) and close (×) buttons — see
 * WidgetChromeContext. Rendered standalone (e.g. in a test), it's just a
 * plain titled card.
 */
export function WidgetFrame({ title, children }: WidgetFrameProps) {
  const chrome = useWidgetChrome();
  // Falls back to a generic label so the section stays identifiable to
  // assistive tech even when a widget (e.g. Clock) omits a visual title —
  // it still gets a real, interactive header once inside WidgetGrid.
  const accessibleLabel = title || (chrome ? "Widget" : undefined);

  return (
    <section className="widget-frame" aria-label={accessibleLabel}>
      {(title || chrome) && (
        <header
          className={`widget-frame__title ${chrome ? "is-draggable" : ""}`}
          onPointerDown={chrome?.onDragStart}
        >
          <span className="widget-frame__title-text">{title}</span>
          {chrome && (
            <div className="widget-frame__title-actions" data-no-drag>
              <button className="widget-frame__title-btn" onClick={chrome.onOpenSettings} aria-label="Widget settings">
                ⚙
              </button>
              <button
                className="widget-frame__title-btn widget-frame__title-btn--close"
                onClick={chrome.onClose}
                aria-label="Close widget"
              >
                ×
              </button>
            </div>
          )}
        </header>
      )}
      <div className="widget-frame__body">{children}</div>
    </section>
  );
}
