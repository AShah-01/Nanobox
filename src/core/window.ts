import { getCurrentWindow } from "@tauri-apps/api/window";

/** Toggles the overlay window's visibility, mirroring the tray menu action. */
export async function toggleOverlay() {
  const win = getCurrentWindow();
  if (await win.isVisible()) {
    await win.hide();
  } else {
    await win.show();
    await win.setFocus();
  }
}
