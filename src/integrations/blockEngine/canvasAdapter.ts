/**
 * Pure conversions between the block engine's storage/evaluation shape
 * (`BlockProgram`, see `types.ts`) and React Flow's node/edge shape
 * (`@xyflow/react`). Kept dependency-light and headless-testable on
 * purpose — `BlockCanvas.tsx` is the only thing that imports React Flow
 * itself; this file only imports its plain type aliases.
 */
import type { Node, Edge as FlowEdge, Connection } from "@xyflow/react";
import type { BlockDef, BlockNode, BlockProgram, Edge, PortType } from "./types";

export interface BlockNodeData extends Record<string, unknown> {
  def: BlockDef;
  label: string;
  config?: Record<string, any>;
}

export type CanvasNode = Node<BlockNodeData>;

/** "any" matches anything; otherwise the two port types must match exactly. */
export function portsCompatible(a: PortType, b: PortType): boolean {
  return a === "any" || b === "any" || a === b;
}

export function makeEdgeId(edge: Pick<Edge, "from" | "to">): string {
  return `${edge.from.nodeId}:${edge.from.portId}->${edge.to.nodeId}:${edge.to.portId}`;
}

export function programToFlow(
  program: BlockProgram,
  definitions: Map<string, BlockDef>,
): { nodes: CanvasNode[]; edges: FlowEdge[] } {
  const nodes: CanvasNode[] = [];
  for (const node of program.nodes) {
    const def = definitions.get(node.defId);
    if (!def) continue;
    nodes.push({
      id: node.id,
      type: "block",
      position: { x: node.x, y: node.y },
      data: { def, label: node.label, config: node.config },
    });
  }

  const edges: FlowEdge[] = program.edges.map((edge) => ({
    id: edge.id || makeEdgeId(edge),
    source: edge.from.nodeId,
    sourceHandle: edge.from.portId,
    target: edge.to.nodeId,
    targetHandle: edge.to.portId,
  }));

  return { nodes, edges };
}

export function flowToProgram(
  base: Pick<BlockProgram, "id" | "name" | "rootNodeId" | "createdAt">,
  nodes: CanvasNode[],
  edges: FlowEdge[],
): BlockProgram {
  const blockNodes: BlockNode[] = nodes.map((n) => ({
    id: n.id,
    defId: n.data.def.id,
    label: n.data.label,
    x: n.position.x,
    y: n.position.y,
    config: n.data.config,
  }));

  const blockEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    from: { nodeId: e.source, portId: e.sourceHandle ?? "" },
    to: { nodeId: e.target, portId: e.targetHandle ?? "" },
  }));

  const rootStillExists = nodes.some((n) => n.id === base.rootNodeId);

  return {
    id: base.id,
    name: base.name,
    nodes: blockNodes,
    edges: blockEdges,
    rootNodeId: rootStillExists ? base.rootNodeId : (nodes[0]?.id ?? base.rootNodeId),
    createdAt: base.createdAt,
    updatedAt: Date.now(),
  };
}

/**
 * Whether a proposed React Flow connection is legal: output → input only
 * (never input → input or output → output), and port types must be
 * compatible per `portsCompatible`. Returns false (rather than throwing) on
 * anything malformed so it can back `isValidConnection` directly.
 */
export function isConnectionValid(connection: Connection | FlowEdge, definitions: Map<string, BlockDef>, nodesById: Map<string, CanvasNode>): boolean {
  const { source, sourceHandle, target, targetHandle } = connection;
  if (!source || !target || !sourceHandle || !targetHandle) return false;
  if (source === target) return false;

  const sourceNode = nodesById.get(source);
  const targetNode = nodesById.get(target);
  if (!sourceNode || !targetNode) return false;

  const sourceDef = definitions.get(sourceNode.data.def.id);
  const targetDef = definitions.get(targetNode.data.def.id);
  if (!sourceDef || !targetDef) return false;

  const outputPort = sourceDef.outputs.find((p) => p.id === sourceHandle);
  const inputPort = targetDef.inputs.find((p) => p.id === targetHandle);
  if (!outputPort || !inputPort) return false;

  return portsCompatible(outputPort.type, inputPort.type);
}
