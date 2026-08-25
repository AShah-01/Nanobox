import { useEffect, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import {
  addStep,
  createBreakdown,
  deleteBreakdown,
  deleteStep,
  listBreakdowns,
  listSteps,
  TaskBreakdown as Breakdown,
  TaskBreakdownStep,
  toggleStep,
} from "../../../storage/taskBreakdowns";
import "./TaskBreakdown.css";

/** Goblin.tools' Magic ToDo, simplified — no AI call, just a manual big-task-to-checklist flow. */
export function TaskBreakdown() {
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [steps, setSteps] = useState<TaskBreakdownStep[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [stepDrafts, setStepDrafts] = useState<Record<number, string>>({});

  const [dbError, setDbError] = useState(false);

  async function refresh() {
    const [b, s] = await Promise.all([listBreakdowns(), listSteps()]);
    setBreakdowns(b);
    setSteps(s);
  }

  useEffect(() => {
    refresh().catch((err) => {
      console.error("failed to load task breakdowns", err);
      setDbError(true);
    });
  }, []);

  async function createNew() {
    if (!newTitle.trim()) return;
    await createBreakdown(newTitle.trim());
    setNewTitle("");
    setShowNewForm(false);
    await refresh();
  }

  async function submitStep(breakdownId: number) {
    const text = (stepDrafts[breakdownId] ?? "").trim();
    if (!text) return;
    await addStep(breakdownId, text);
    setStepDrafts((d) => ({ ...d, [breakdownId]: "" }));
    await refresh();
  }

  return (
    <WidgetFrame title="Task Breakdown">
      <div className="breakdown-widget">
        {dbError && <p className="breakdown-widget__empty">⚠ Failed to load tasks. Restart the app to retry.</p>}
        {breakdowns.map((b) => {
          const mySteps = steps.filter((s) => s.breakdown_id === b.id);
          const done = mySteps.filter((s) => s.completed).length;
          return (
            <div key={b.id} className="breakdown-widget__group">
              <div className="breakdown-widget__group-header">
                <span className="breakdown-widget__title">{b.title}</span>
                <span className="breakdown-widget__progress">
                  {mySteps.length > 0 ? `${done}/${mySteps.length}` : ""}
                </span>
                <button onClick={() => deleteBreakdown(b.id).then(refresh)} aria-label="Delete breakdown">
                  ×
                </button>
              </div>
              <ul className="breakdown-widget__steps">
                {mySteps.map((s) => (
                  <li key={s.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={s.completed}
                        onChange={(e) => toggleStep(s.id, e.target.checked).then(refresh)}
                      />
                      <span className={s.completed ? "is-done" : ""}>{s.text}</span>
                    </label>
                    <button onClick={() => deleteStep(s.id).then(refresh)} aria-label="Remove step">
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="breakdown-widget__step-input">
                <input
                  placeholder="+ step"
                  value={stepDrafts[b.id] ?? ""}
                  onChange={(e) => setStepDrafts((d) => ({ ...d, [b.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && submitStep(b.id)}
                />
              </div>
            </div>
          );
        })}
        {breakdowns.length === 0 && !showNewForm && (
          <p className="breakdown-widget__empty">Got something big and vague? Break it down.</p>
        )}

        {showNewForm ? (
          <div className="breakdown-widget__new-form">
            <input
              placeholder="e.g. Write quarterly report"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNew()}
              autoFocus
            />
            <div className="breakdown-widget__new-actions">
              <button onClick={() => setShowNewForm(false)}>Cancel</button>
              <button className="breakdown-widget__btn--primary" onClick={createNew}>
                Add
              </button>
            </div>
          </div>
        ) : (
          <button className="breakdown-widget__add" onClick={() => setShowNewForm(true)}>
            + New task
          </button>
        )}
      </div>
    </WidgetFrame>
  );
}
