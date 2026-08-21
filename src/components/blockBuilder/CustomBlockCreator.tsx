import { useEffect, useState } from "react";
import type { PortType } from "../../integrations/blockEngine/types";
import {
  buildAndRegisterCustomBlockDef,
  compileCustomBlockBody,
  CUSTOM_DEF_PREFIX,
  MAX_JS_BODY_BYTES,
  unregisterCustomBlockEvaluator,
} from "../../integrations/blockEngine/customBlockLoader";
import {
  createCustomBlockDef,
  deleteCustomBlockDef,
  getCustomBlockDef,
  parsePorts,
  updateCustomBlockDef,
  type CustomBlockDefRow,
  type CustomPortSpec,
} from "../../storage/customBlockDefs";
import "./CustomBlockCreator.css";

interface CustomBlockCreatorProps {
  /** Row id of the definition being edited; omit to create a new one. */
  editingId?: number;
  onClose: () => void;
  onSaved: () => void;
}

/** The port types a custom block can declare, in the wording the UI uses. */
const PORT_TYPES: Array<{ value: PortType; label: string }> = [
  { value: "string", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "array", label: "List" },
  { value: "any", label: "Any" },
];

const EXAMPLE_BODY = "// inputs holds each input port's value, keyed by port name.\n// Return the value for the first output port.\nreturn inputs.a + inputs.b;";

let portCounter = 0;
function nextPortId(): string {
  portCounter += 1;
  return `p${Date.now().toString(36)}${portCounter}`;
}

function newPort(): CustomPortSpec {
  return { id: nextPortId(), name: "", type: "any" };
}

/** Port ids double as the keys on `inputs`, so they follow the user-typed name. */
function slugify(name: string, fallback: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || fallback;
}

function withResolvedIds(ports: CustomPortSpec[]): CustomPortSpec[] {
  const seen = new Set<string>();
  return ports.map((port, index) => {
    let id = slugify(port.name, `port_${index + 1}`);
    while (seen.has(id)) id = `${id}_${index + 1}`;
    seen.add(id);
    return { ...port, id, name: port.name.trim() || id };
  });
}

/**
 * Modal for authoring a custom block: label, description, ports, and a JS
 * body. On save the definition is written to SQLite *and* registered in the
 * live engine, so it's usable from the palette without reopening the builder.
 */
export function CustomBlockCreator({ editingId, onClose, onSaved }: CustomBlockCreatorProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [inputs, setInputs] = useState<CustomPortSpec[]>([]);
  const [outputs, setOutputs] = useState<CustomPortSpec[]>([newPort()]);
  const [jsBody, setJsBody] = useState("");
  const [existing, setExisting] = useState<CustomBlockDefRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editingId === undefined) return;
    let cancelled = false;
    getCustomBlockDef(editingId)
      .then((row) => {
        if (cancelled || !row) return;
        setExisting(row);
        setLabel(row.label);
        setDescription(row.description);
        setInputs(parsePorts(row.inputs_json));
        const storedOutputs = parsePorts(row.outputs_json);
        setOutputs(storedOutputs.length > 0 ? storedOutputs : [newPort()]);
        setJsBody(row.js_body);
      })
      .catch((err) => {
        console.error("failed to load custom block def", err);
        if (!cancelled) setError("That custom block couldn't be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  function updatePort(
    setter: React.Dispatch<React.SetStateAction<CustomPortSpec[]>>,
    index: number,
    patch: Partial<CustomPortSpec>,
  ) {
    setter((current) => current.map((port, i) => (i === index ? { ...port, ...patch } : port)));
  }

  async function handleSave() {
    setError(null);

    if (!label.trim()) {
      setError("Give the block a label.");
      return;
    }
    const resolvedOutputs = withResolvedIds(outputs.filter((p) => p.name.trim() || outputs.length === 1));
    if (resolvedOutputs.length === 0) {
      setError("A custom block needs at least one output port.");
      return;
    }
    const resolvedInputs = withResolvedIds(inputs);
    if (new TextEncoder().encode(jsBody).length > MAX_JS_BODY_BYTES) {
      setError(`The body is too long — keep it under ${Math.round(MAX_JS_BODY_BYTES / 1024)} KB.`);
      return;
    }
    try {
      // Compile-check before touching the DB so a syntax error never gets saved.
      compileCustomBlockBody(jsBody);
    } catch (err) {
      setError(`That body doesn't parse: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    const defId = existing?.def_id ?? `${CUSTOM_DEF_PREFIX}${slugify(label, "block")}_${Date.now().toString(36)}`;
    const payload = {
      defId,
      label: label.trim(),
      description: description.trim(),
      inputs: resolvedInputs,
      outputs: resolvedOutputs,
      jsBody,
    };

    setBusy(true);
    try {
      const rowId = existing ? (await updateCustomBlockDef(existing.id, payload), existing.id) : await createCustomBlockDef(payload);
      buildAndRegisterCustomBlockDef({
        id: rowId,
        def_id: defId,
        label: payload.label,
        description: payload.description,
        inputs_json: JSON.stringify(resolvedInputs),
        outputs_json: JSON.stringify(resolvedOutputs),
        js_body: jsBody,
        created_at: existing?.created_at ?? Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error("failed to save custom block def", err);
      setError("Save failed — see the console for details.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setBusy(true);
    try {
      await deleteCustomBlockDef(existing.id);
      unregisterCustomBlockEvaluator(existing.def_id);
      onSaved();
      onClose();
    } catch (err) {
      console.error("failed to delete custom block def", err);
      setError("Delete failed — see the console for details.");
    } finally {
      setBusy(false);
    }
  }

  function renderPortList(
    heading: string,
    ports: CustomPortSpec[],
    setter: React.Dispatch<React.SetStateAction<CustomPortSpec[]>>,
    minimum: number,
  ) {
    return (
      <section className="cbc__section">
        <div className="cbc__section-head">
          <h3 className="cbc__subtitle">{heading}</h3>
          <button type="button" className="cbc__small" onClick={() => setter((c) => [...c, newPort()])}>
            Add
          </button>
        </div>
        {ports.length === 0 ? (
          <p className="cbc__empty">None.</p>
        ) : (
          <ul className="cbc__ports">
            {ports.map((port, index) => (
              <li key={port.id} className="cbc__port">
                <input
                  className="cbc__port-name"
                  value={port.name}
                  placeholder="port name"
                  aria-label={`${heading} ${index + 1} name`}
                  onChange={(e) => updatePort(setter, index, { name: e.target.value })}
                />
                <select
                  className="cbc__port-type"
                  value={port.type}
                  aria-label={`${heading} ${index + 1} type`}
                  onChange={(e) => updatePort(setter, index, { type: e.target.value as PortType })}
                >
                  {PORT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="cbc__small"
                  disabled={ports.length <= minimum}
                  aria-label={`Remove ${heading} ${index + 1}`}
                  onClick={() => setter((c) => c.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div className="cbc__overlay" role="dialog" aria-modal="true" aria-label="Custom block creator">
      <div className="cbc">
        <h2 className="cbc__title">{existing ? "Edit custom block" : "New custom block"}</h2>

        <label className="cbc__row">
          Label
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add Numbers" />
        </label>

        <label className="cbc__row">
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Adds two numbers together"
          />
        </label>

        {renderPortList("Inputs", inputs, setInputs, 0)}
        {renderPortList("Outputs", outputs, setOutputs, 1)}

        <label className="cbc__row">
          JS body
          <textarea
            className="cbc__body"
            rows={12}
            spellCheck={false}
            value={jsBody}
            onChange={(e) => setJsBody(e.target.value)}
            placeholder={EXAMPLE_BODY}
          />
        </label>
        <p className="cbc__hint">
          Runs with only an <code>inputs</code> object in scope. Return the value for the first output port.
        </p>

        {error && (
          <p className="cbc__error" role="alert">
            {error}
          </p>
        )}

        <div className="cbc__actions">
          {existing && (
            <button type="button" className="cbc__danger" onClick={handleDelete} disabled={busy}>
              Delete
            </button>
          )}
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="cbc__primary" onClick={handleSave} disabled={busy}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
