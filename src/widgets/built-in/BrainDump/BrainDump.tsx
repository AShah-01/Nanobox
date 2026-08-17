import { useEffect, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { BrainDumpEntry, createBrainDumpEntry, deleteBrainDumpEntry, listBrainDumpEntries } from "../../../storage/brainDump";
import "./BrainDump.css";

/** Near-zero-friction capture: type, hit Enter, done. No title, no dialog — write it down before you lose it. */
export function BrainDump() {
  const [entries, setEntries] = useState<BrainDumpEntry[]>([]);
  const [draft, setDraft] = useState("");

  async function refresh() {
    setEntries(await listBrainDumpEntries());
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load brain dump", err));
  }, []);

  async function capture() {
    if (!draft.trim()) return;
    await createBrainDumpEntry(draft.trim());
    setDraft("");
    await refresh();
  }

  return (
    <WidgetFrame title="Brain Dump">
      <div className="braindump-widget">
        <input
          className="braindump-widget__input"
          placeholder="Type it, hit Enter…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && capture()}
          autoFocus
        />
        <ul className="braindump-widget__list">
          {entries.map((e) => (
            <li key={e.id} className="braindump-widget__item">
              <span>{e.text}</span>
              <button onClick={() => deleteBrainDumpEntry(e.id).then(refresh)} aria-label="Delete">
                ×
              </button>
            </li>
          ))}
          {entries.length === 0 && <li className="braindump-widget__empty">Nothing captured yet.</li>}
        </ul>
      </div>
    </WidgetFrame>
  );
}
