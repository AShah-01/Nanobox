import { useEffect, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { createNote, deleteNote, listNotes, Note, toggleNotePinned, updateNote } from "../../../storage/notes";
import "./Notes.css";

const COLORS = [null, "#7c9cff", "#ff8a8a", "#8affc1", "#ffd479", "#c792ff"];

interface DraftState {
  id: number | null;
  title: string;
  body: string;
  color: string | null;
}

const emptyDraft: DraftState = { id: null, title: "", body: "", color: null };

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setNotes(await listNotes());
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load notes", err));
  }, []);

  async function saveDraft() {
    if (!draft || !draft.title.trim()) return;
    if (draft.id === null) {
      await createNote({ title: draft.title.trim(), body: draft.body, color: draft.color });
    } else {
      await updateNote(draft.id, { title: draft.title.trim(), body: draft.body, color: draft.color });
    }
    setDraft(null);
    await refresh();
  }

  async function remove(id: number) {
    await deleteNote(id);
    await refresh();
  }

  async function togglePin(note: Note) {
    await toggleNotePinned(note.id, !note.pinned);
    await refresh();
  }

  return (
    <WidgetFrame title="Notes">
      <div className="notes-widget">
        {loading ? (
          <p className="notes-widget__empty">Loading…</p>
        ) : (
          <ul className="notes-widget__list">
            {notes.map((note) => (
              <li key={note.id} className="notes-widget__item">
                <span className="notes-widget__dot" style={{ background: note.color ?? "transparent" }} />
                <div className="notes-widget__item-body" onClick={() => setDraft({ ...note })}>
                  <span className="notes-widget__item-title">{note.title}</span>
                  {note.body && <span className="notes-widget__item-preview">{note.body}</span>}
                </div>
                <button
                  className={`notes-widget__pin ${note.pinned ? "is-active" : ""}`}
                  onClick={() => togglePin(note)}
                  aria-label={note.pinned ? "Unpin note" : "Pin note"}
                  title={note.pinned ? "Unpin" : "Pin"}
                >
                  ★
                </button>
                <button className="notes-widget__delete" onClick={() => remove(note.id)} aria-label="Delete note" title="Delete">
                  ×
                </button>
              </li>
            ))}
            {notes.length === 0 && <p className="notes-widget__empty">No notes yet.</p>}
          </ul>
        )}

        {draft ? (
          <div className="notes-widget__form">
            <input
              className="notes-widget__input"
              placeholder="Title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              autoFocus
            />
            <textarea
              className="notes-widget__textarea"
              placeholder="Write something…"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={3}
            />
            <div className="notes-widget__form-row">
              <div className="notes-widget__swatches">
                {COLORS.map((c) => (
                  <button
                    key={c ?? "none"}
                    className={`notes-widget__swatch ${draft.color === c ? "is-selected" : ""}`}
                    style={{ background: c ?? "transparent" }}
                    onClick={() => setDraft({ ...draft, color: c })}
                    aria-label={c ?? "No colour"}
                  />
                ))}
              </div>
              <div className="notes-widget__form-actions">
                <button className="notes-widget__btn" onClick={() => setDraft(null)}>
                  Cancel
                </button>
                <button className="notes-widget__btn notes-widget__btn--primary" onClick={saveDraft}>
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button className="notes-widget__add" onClick={() => setDraft(emptyDraft)}>
            + New note
          </button>
        )}
      </div>
    </WidgetFrame>
  );
}
