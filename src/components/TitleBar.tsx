import { getCurrentWindow } from "@tauri-apps/api/window";
import logoMark from "../assets/logo/nanobox-mark.svg";
import "./TitleBar.css";

/**
 * Custom drag handle for the borderless overlay window. Tauri has no native
 * title bar to grab (decorations: false, by design, for the transparent
 * widget-canvas look) — without this, the window can never be repositioned.
 * `data-tauri-drag-region` makes the bar itself draggable while leaving
 * nested interactive elements (the hide button) clickable as normal.
 */
export function TitleBar() {
  return (
    <header className="title-bar" data-tauri-drag-region>
      <div className="title-bar__brand" data-tauri-drag-region>
        <img src={logoMark} alt="" width="16" height="16" />
        <span>Nanobox</span>
      </div>
      <button className="title-bar__hide" onClick={() => getCurrentWindow().hide()} aria-label="Hide Nanobox" title="Hide (tray icon shows it again)">
        —
      </button>
    </header>
  );
}
