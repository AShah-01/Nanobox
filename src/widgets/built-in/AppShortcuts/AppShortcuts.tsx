import { useEffect, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openPath } from "@tauri-apps/plugin-opener";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { createShortcut, deleteShortcut, listShortcuts, renameShortcut, Shortcut } from "../../../storage/shortcuts";
import "./AppShortcuts.css";

function baseName(path: string) {
  const withoutExt = path.replace(/\.(exe|app|lnk)$/i, "");
  return withoutExt.split(/[\\/]/).pop() ?? withoutExt;
}

export function AppShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function refresh() {
    setShortcuts(await listShortcuts());
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load shortcuts", err));
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          setDragOver(true);
        } else if (event.payload.type === "drop") {
          setDragOver(false);
          Promise.all(event.payload.paths.map((p) => createShortcut({ label: baseName(p), target_path: p })))
            .then(refresh)
            .catch((err) => console.error("failed to add dropped shortcut", err));
        } else {
          setDragOver(false);
        }
      })
      .then((fn) => (unlisten = fn));
    return () => unlisten?.();
  }, []);

  async function browse() {
    const selected = await openDialog({ multiple: true });
    if (!selected) return;
    const paths = Array.isArray(selected) ? selected : [selected];
    await Promise.all(paths.map((p) => createShortcut({ label: baseName(p), target_path: p })));
    await refresh();
  }

  async function launch(s: Shortcut) {
    try {
      await openPath(s.target_path);
    } catch (err) {
      console.error("failed to launch shortcut", err);
    }
  }

  async function commitRename() {
    if (renamingId !== null && renameValue.trim()) {
      await renameShortcut(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    await refresh();
  }

  return (
    <WidgetFrame title="Shortcuts">
      <div className={`shortcuts-widget ${dragOver ? "is-drag-over" : ""}`}>
        <div className="shortcuts-widget__grid">
          {shortcuts.map((s) => (
            <div key={s.id} className="shortcuts-widget__tile">
              <button
                className="shortcuts-widget__icon"
                onClick={() => launch(s)}
                title={s.target_path}
                aria-label={`Launch ${s.label}`}
              >
                {s.label.slice(0, 1).toUpperCase() || "?"}
              </button>
              {renamingId === s.id ? (
                <input
                  className="shortcuts-widget__rename-input"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => e.key === "Enter" && commitRename()}
                />
              ) : (
                <span
                  className="shortcuts-widget__label"
                  onDoubleClick={() => {
                    setRenamingId(s.id);
                    setRenameValue(s.label);
                  }}
                >
                  {s.label}
                </span>
              )}
              <button className="shortcuts-widget__delete" onClick={() => deleteShortcut(s.id).then(refresh)} aria-label="Remove">
                ×
              </button>
            </div>
          ))}

          <button className="shortcuts-widget__add-tile" onClick={browse} title="Add a shortcut">
            +
          </button>
        </div>
        <p className="shortcuts-widget__hint">Drag files/apps here, or click + to browse. Double-click a name to rename.</p>
      </div>
    </WidgetFrame>
  );
}
