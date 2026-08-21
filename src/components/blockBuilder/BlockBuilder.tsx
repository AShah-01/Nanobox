import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge as FlowEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { BlockDef, BlockProgram } from "../../integrations/blockEngine/types";
import { evaluateProgram, getBlockDefs, validateProgram } from "../../integrations/blockEngine/evaluator";
import { initBlockLibrary } from "../../integrations/blockEngine/blockLibrary";
import { liveBridge } from "../../integrations/blockEngine/bridge";
import {
  flowToProgram,
  isConnectionValid,
  makeEdgeId,
  programToFlow,
  type CanvasNode,
} from "../../integrations/blockEngine/canvasAdapter";
import {
  createBlockProgram,
  deleteBlockProgram,
  listBlockPrograms,
  updateBlockProgram,
  type BlockProgramRow,
} from "../../storage/blockPrograms";
import { exportNanowidget, importNanowidget } from "../../core/nanowidgetExport";
import { BlockNodeView } from "./BlockNodeView";
import { BlockPalette } from "./BlockPalette";
import "./BlockBuilder.css";

initBlockLibrary();

const NODE_TYPES = { block: BlockNodeView };

const PLACEMENT_X = 240;
const PLACEMENT_Y = 160;

interface BlockBuilderProps {
  open: boolean;
  onClose: () => void;
}

let nodeCounter = 0;
function nextNodeId(): string {
  nodeCounter += 1;
  return `n${Date.now().toString(36)}${nodeCounter}`;
}

export function BlockBuilder({ open, onClose }: BlockBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [name, setName] = useState("Untitled program");
  const [savedId, setSavedId] = useState<number | null>(null);
  const [rootNodeId, setRootNodeId] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<BlockProgramRow[]>([]);
  const [status, setStatus] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);
  const createdAtRef = useRef(Date.now());

  const definitions = useMemo(() => getBlockDefs(), []);
  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const refreshPrograms = useCallback(() => {
    listBlockPrograms()
      .then(setPrograms)
      .catch((err) => console.error("failed to list block programs", err));
  }, []);

  useEffect(() => {
    if (open) refreshPrograms();
  }, [open, refreshPrograms]);

  const buildProgram = useCallback(
    (): BlockProgram =>
      flowToProgram(
        { id: savedId ? String(savedId) : "draft", name, rootNodeId, createdAt: createdAtRef.current },
        nodes,
        edges,
      ),
    [savedId, name, rootNodeId, nodes, edges],
  );

  const addBlock = useCallback(
    (def: BlockDef) => {
      const id = nextNodeId();
      setNodes((current) => [
        ...current,
        {
          id,
          type: "block",
          // Wider than a node's footprint on both axes: a new block landing on
          // top of an existing one covers its port handles, which makes them
          // undraggable until the user moves it away.
          position: {
            x: 60 + (current.length % 3) * PLACEMENT_X,
            y: 60 + Math.floor(current.length / 3) * PLACEMENT_Y,
          },
          data: { def, label: def.label },
        },
      ]);
      setRootNodeId((current) => current || id);
    },
    [setNodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isConnectionValid(connection, definitions, nodesById)) {
        setStatus({ kind: "error", text: "Those ports aren't compatible — check the port types." });
        return;
      }
      setStatus(null);
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: makeEdgeId({
              from: { nodeId: connection.source, portId: connection.sourceHandle ?? "" },
              to: { nodeId: connection.target, portId: connection.targetHandle ?? "" },
            }),
          },
          current,
        ),
      );
    },
    [definitions, nodesById, setEdges],
  );

  const isValidConnection = useCallback(
    (connection: Connection | FlowEdge) => isConnectionValid(connection, definitions, nodesById),
    [definitions, nodesById],
  );

  function loadProgram(row: BlockProgramRow) {
    try {
      const program = JSON.parse(row.program_json) as BlockProgram;
      const flow = programToFlow(program, definitions);
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setName(program.name);
      setRootNodeId(program.rootNodeId);
      setSavedId(row.id);
      createdAtRef.current = program.createdAt;
      setStatus({ kind: "info", text: `Loaded "${program.name}".` });
    } catch (err) {
      console.error("failed to load block program", err);
      setStatus({ kind: "error", text: "That saved program couldn't be read." });
    }
  }

  function newProgram() {
    setNodes([]);
    setEdges([]);
    setName("Untitled program");
    setRootNodeId("");
    setSavedId(null);
    createdAtRef.current = Date.now();
    setStatus(null);
  }

  async function save() {
    const program = buildProgram();
    try {
      if (savedId === null) {
        const id = await createBlockProgram(program);
        setSavedId(id);
      } else {
        await updateBlockProgram(savedId, program);
      }
      refreshPrograms();
      setStatus({ kind: "ok", text: "Saved." });
    } catch (err) {
      console.error("failed to save block program", err);
      setStatus({ kind: "error", text: "Save failed — see the console for details." });
    }
  }

  async function remove(row: BlockProgramRow) {
    try {
      await deleteBlockProgram(row.id);
      if (savedId === row.id) newProgram();
      refreshPrograms();
    } catch (err) {
      console.error("failed to delete block program", err);
    }
  }

  function validate() {
    const result = validateProgram(buildProgram());
    setStatus(
      result.valid
        ? { kind: "ok", text: "Program is valid." }
        : { kind: "error", text: result.errors.join(" · ") },
    );
  }

  async function run() {
    setStatus({ kind: "info", text: "Running…" });
    const result = await evaluateProgram(buildProgram(), liveBridge);
    setStatus(
      result.success
        ? { kind: "ok", text: `Result: ${JSON.stringify(result.value) ?? "undefined"}` }
        : { kind: "error", text: result.error ?? "Evaluation failed." },
    );
  }

  async function handleExport() {
    try {
      await exportNanowidget(buildProgram());
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "Export failed." });
    }
  }

  async function handleImport() {
    try {
      const newId = await importNanowidget();
      if (newId === null) return; // user cancelled
      refreshPrograms();
      const rows = await listBlockPrograms();
      const imported = rows.find((r) => r.id === newId);
      if (imported) loadProgram(imported);
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "Import failed." });
    }
  }

  if (!open) return null;

  return (
    <div className="block-builder" role="dialog" aria-modal="true" aria-label="Block builder">
      <header className="block-builder__bar">
        <input
          className="block-builder__name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Program name"
        />
        <button type="button" onClick={newProgram}>
          New
        </button>
        <button type="button" onClick={save}>
          Save
        </button>
        <button type="button" onClick={validate}>
          Validate
        </button>
        <button type="button" onClick={run}>
          Run once
        </button>
        <button type="button" onClick={handleExport} disabled={savedId === null && nodes.length === 0}>
          Export
        </button>
        <button type="button" onClick={handleImport}>
          Import
        </button>
        <button
          type="button"
          onClick={() => selectedId && setRootNodeId(selectedId)}
          disabled={!selectedId || selectedId === rootNodeId}
          title="The root block is the one evaluated first; its inputs pull everything wired into them."
        >
          Set as root
        </button>
        <span className="block-builder__root">
          Root: {nodes.find((n) => n.id === rootNodeId)?.data.label ?? "none"}
        </span>
        <button type="button" className="block-builder__close" onClick={onClose} aria-label="Close block builder">
          ×
        </button>
      </header>

      <div className="block-builder__body">
        <BlockPalette onAdd={addBlock} />

        <div className="block-builder__canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onSelectionChange={({ nodes: selected }) => setSelectedId(selected[0]?.id ?? null)}
            nodeTypes={NODE_TYPES}
            fitView
            proOptions={{ hideAttribution: false }}
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>

        <aside className="block-builder__saved" aria-label="Saved programs">
          <h3>Saved</h3>
          {programs.length === 0 ? (
            <p className="block-builder__empty">Nothing saved yet.</p>
          ) : (
            <ul>
              {programs.map((row) => (
                <li key={row.id}>
                  <button type="button" onClick={() => loadProgram(row)}>
                    {row.name}
                  </button>
                  <button type="button" onClick={() => remove(row)} aria-label={`Delete ${row.name}`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {status && (
        <p className={`block-builder__status block-builder__status--${status.kind}`} role="status">
          {status.text}
        </p>
      )}
    </div>
  );
}
