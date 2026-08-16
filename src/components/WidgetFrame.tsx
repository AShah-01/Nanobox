import { PropsWithChildren } from "react";
import "./WidgetFrame.css";

interface WidgetFrameProps extends PropsWithChildren {
  title?: string;
}

/** Shared chrome every built-in and lego-block widget renders inside. */
export function WidgetFrame({ title, children }: WidgetFrameProps) {
  return (
    <section className="widget-frame" aria-label={title}>
      {title && <header className="widget-frame__title">{title}</header>}
      <div className="widget-frame__body">{children}</div>
    </section>
  );
}
