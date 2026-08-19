//! Icon extraction for the App Shortcuts widget ("Error 6": shortcuts were
//! rendering a first-letter avatar instead of the target app's real icon).
//!
//! `extract_file_icon` pulls the OS-associated icon for a shortcut's
//! `target_path` and returns it as a `data:image/png;base64,...` URL so the
//! frontend can just drop it into an `<img src>`. The result is cached by the
//! caller (see `src/storage/shortcuts.ts` -> `updateShortcutIcon`) in the
//! `shortcuts.icon_data` column rather than re-extracted on every render.
//!
//! Windows uses the `windows-icons` crate (Win32 shell APIs under the hood —
//! `SHGetFileInfoW` / `IShellItemImageFactory` / UWP package logo lookup) so
//! we don't hand-roll HICON -> PNG conversion. macOS/Linux currently return
//! `Ok(None)` — the frontend already falls back to the first-letter avatar
//! whenever `icon_data` is null, so this degrades gracefully rather than
//! erroring the widget out. A Cocoa-based `NSWorkspace.icon(forFile:)`
//! implementation can be slotted in behind `#[cfg(target_os = "macos")]`
//! later without touching the frontend or the command signature.

#[tauri::command]
pub fn extract_file_icon(path: String) -> Result<Option<String>, String> {
    extract_icon_impl(&path)
}

/// Reads an arbitrary image file from disk (used by the "Choose custom
/// icon..." context-menu action) and returns it as a `data:` URL. Kept
/// separate from `extract_file_icon` since this one just reads bytes the
/// user explicitly picked via a native file dialog — no shell/icon APIs
/// involved.
#[tauri::command]
pub fn read_image_as_data_url(path: String) -> Result<String, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let mime = match std::path::Path::new(&path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "webp" => "image/webp",
        "ico" => "image/x-icon",
        "svg" => "image/svg+xml",
        _ => "application/octet-stream",
    };
    use base64::Engine;
    let encoded = base64::engine::general_purpose::STANDARD.encode(bytes);
    Ok(format!("data:{mime};base64,{encoded}"))
}

#[cfg(target_os = "windows")]
fn extract_icon_impl(path: &str) -> Result<Option<String>, String> {
    use windows_icons::{get_icon_base64_by_path_with_size, IconSize};

    match get_icon_base64_by_path_with_size(path, IconSize::Medium) {
        Ok(b64) if !b64.is_empty() => Ok(Some(format!("data:image/png;base64,{b64}"))),
        // Extraction can legitimately fail for missing files, shortcuts that
        // point somewhere invalid, etc. — not a hard error, just "no icon".
        Ok(_) | Err(_) => Ok(None),
    }
}

#[cfg(not(target_os = "windows"))]
fn extract_icon_impl(_path: &str) -> Result<Option<String>, String> {
    // macOS/Linux: no icon extraction wired up yet. Returning `None` (rather
    // than an `Err`) is deliberate — the frontend treats a null `icon_data`
    // as "fall back to the first-letter avatar", so the widget stays fully
    // functional, it just doesn't show real icons on these platforms yet.
    Ok(None)
}
