import { useMemo, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { updateWidgetSettings, WidgetInstance } from "../../../storage/widgetInstances";
import "./CustomWidget.css";

interface CustomWidgetCode {
  html: string;
  css: string;
  js: string;
}

const STARTER: CustomWidgetCode = {
  html: `<div id="app"></div>`,
  css: `body { margin: 0; height: 100%; display: flex; align-items: center; justify-content: center; font-family: sans-serif; color: #fff; }
#app { font-size: 1.4em; font-weight: 700; text-align: center; }`,
  js: `let n = 0;
const el = document.getElementById("app");
function tick() {
  el.textContent = "Hello, dev 👋 (" + n++ + ")";
}
tick();
setInterval(tick, 1000);`,
};

function parseSettings(raw: string | null): CustomWidgetCode {
  if (!raw) return STARTER;
  try {
    const parsed = JSON.parse(raw);
    return { html: parsed.html ?? "", css: parsed.css ?? "", js: parsed.js ?? "" };
  } catch {
    return STARTER;
  }
}

function buildSrcDoc(code: CustomWidgetCode): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${code.css}</style></head><body>${code.html}<script>${code.js}<\/script></body></html>`;
}

interface CustomWidgetProps {
  instance: WidgetInstance;
  onSaved?: (settings: string) => void;
}

/**
 * MVP developer-capability widget: runs dev-authored HTML/CSS/JS in an
 * iframe with `sandbox="allow-scripts"` and no `allow-same-origin` — the
 * frame gets an opaque origin, so it cannot reach `window.parent`, Nanobox's
 * data, or any Tauri API. This is NOT yet the full Milestone 6 lego-block
 * engine (Compartment/ShadowRealm + whitelisted bridge API for controlled
 * host access) — it's a simpler precursor with a real but narrower security
 * boundary. Known gap: the sandbox does not block outbound network requests
 * from the widget's own JS (`fetch`, `XMLHttpRequest`) — only isolates it
 * from the app. See ROADMAP.md Milestone 6.
 */
export function CustomWidget({ instance, onSaved }: CustomWidgetProps) {
  const initial = useMemo(() => parseSettings(instance.settings), [instance.id]);
  const [editing, setEditing] = useState(instance.settings === null);
  const [code, setCode] = useState(initial);
  const [previewCode, setPreviewCode] = useState(initial);

  async function save() {
    const json = JSON.stringify(code);
    await updateWidgetSettings(instance.id, json);
    setPreviewCode(code);
    setEditing(false);
    onSaved?.(json);
  }

  return (
    <WidgetFrame title="Custom Widget">
      <div className="custom-widget">
        {editing ? (
          <div className="custom-widget__editor" data-no-drag>
            <label>
              HTML
              <textarea value={code.html} onChange={(e) => setCode({ ...code, html: e.target.value })} rows={3} />
            </label>
            <label>
              CSS
              <textarea value={code.css} onChange={(e) => setCode({ ...code, css: e.target.value })} rows={3} />
            </label>
            <label>
              JavaScript
              <textarea value={code.js} onChange={(e) => setCode({ ...code, js: e.target.value })} rows={4} />
            </label>
            <p className="custom-widget__hint">
              Runs sandboxed — no access to Nanobox data, files, or Tauri APIs. Network calls from your JS aren't blocked yet.
            </p>
            <div className="custom-widget__actions">
              <button onClick={() => setEditing(false)}>Cancel</button>
              <button className="custom-widget__save" onClick={save}>
                Save &amp; Run
              </button>
            </div>
          </div>
        ) : (
          <div className="custom-widget__preview" data-no-drag>
            <iframe
              title="Custom widget preview"
              className="custom-widget__frame"
              sandbox="allow-scripts"
              srcDoc={buildSrcDoc(previewCode)}
            />
            <button className="custom-widget__edit" onClick={() => setEditing(true)}>
              Edit code
            </button>
          </div>
        )}
      </div>
    </WidgetFrame>
  );
}
