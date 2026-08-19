import { useEffect, useState } from "react";
import { getCurrentWindow, type Window as TauriWindow } from "@tauri-apps/api/window";
import logoMark from "../assets/logo/nanobox-mark.svg";
import "./TitleBar.css";

let win: TauriWindow | null;
try {
  win = getCurrentWindow();
} catch {
  win = null;
}

interface TitleBarProps {
  onSettingsClick?: () => void;
  onBlockBuilderClick?: () => void;
}

/**
 * Custom drag handle + window controls for the borderless overlay window
 * (decorations: false, by design, for the transparent widget-canvas look —
 * Tauri gives no native title bar to grab or click for a window like this).
 *
 * Dragging uses an explicit `startDragging()` call on pointerdown rather
 * than the passive `data-tauri-drag-region` attribute: this app also uses
 * `dragDropEnabled` (the webview's own OS file-drop handling, needed by the
 * App Shortcuts widget), which can intercept the same mouse gesture the
 * passive attribute relies on. Calling the window API directly is the more
 * robust pattern Tauri's own custom-title-bar examples use, especially once
 * the bar also has buttons that must NOT start a drag.
 */
export function TitleBar({ onSettingsClick, onBlockBuilderClick }: TitleBarProps) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!win) return;
    win.isMaximized().then(setMaximized);
    const unlisten = win.onResized(() => {
      win.isMaximized().then(setMaximized);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  function startDrag(e: React.PointerEvent) {
    if (!win) return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    win.startDragging().catch((err) => console.error("failed to start window drag", err));
  }

  return (
    <header className="title-bar" onPointerDown={startDrag}>
      <div className="title-bar__brand">
        <img src={logoMark} alt="" width="16" height="16" />
        <span>Nanobox</span>
      </div>
      <div className="title-bar__controls" data-no-drag>
        <button
          className="title-bar__btn"
          onClick={onBlockBuilderClick}
          aria-label="Block builder"
          title="Open the block builder"
        >
          🧩
        </button>
        <button
          className="title-bar__btn"
          onClick={onSettingsClick}
          aria-label="Settings"
          title="Open settings"
        >
          ⚙️
        </button>
        {win && (
          <>
            <button
              className="title-bar__btn"
              onClick={() => win.minimize().catch((err) => console.error("failed to minimize window", err))}
              aria-label="Minimize"
              title="Minimize to taskbar"
            >
              &#8211;
            </button>
            <button
              className="title-bar__btn"
              onClick={() => win.toggleMaximize().catch((err) => console.error("failed to toggle maximize", err))}
              aria-label={maximized ? "Restore" : "Maximize"}
              title={maximized ? "Restore" : "Maximize"}
            >
              {maximized ? "❐" : "☐"}
            </button>
            <button
              className="title-bar__btn title-bar__btn--close"
              onClick={() => win.hide().catch((err) => console.error("failed to hide window", err))}
              aria-label="Close"
              title="Close (hides to tray — use the tray icon's Quit to actually exit)"
            >
              &#215;
            </button>
          </>
        )}
      </div>
    </header>
  );
}
