import type { BlockProgram, BlockNode, BlockDef, ExecutionContext, EvalResult } from "./types";

const MAX_EXECUTION_DEPTH = 100;
const DEFAULT_BLOCK_DEFS = new Map<string, BlockDef>();

/**
 * Register a block definition so it can be used in programs.
 */
export function registerBlockDef(def: BlockDef) {
  DEFAULT_BLOCK_DEFS.set(def.id, def);
}

/**
 * Validate a block program for correctness.
 * - All referenced blocks exist
 * - All edges connect valid ports
 * - No type mismatches on connections
 * - Root node exists
 */
export function validateProgram(program: BlockProgram): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!program.nodes.find((n) => n.id === program.rootNodeId)) {
    errors.push(`Root node "${program.rootNodeId}" not found`);
  }

  program.nodes.forEach((node) => {
    const def = DEFAULT_BLOCK_DEFS.get(node.defId);
    if (!def) {
      errors.push(`Block definition "${node.defId}" not registered (used by node "${node.id}")`);
    }
  });

  program.edges.forEach((edge) => {
    const fromNode = program.nodes.find((n) => n.id === edge.from.nodeId);
    const toNode = program.nodes.find((n) => n.id === edge.to.nodeId);

    if (!fromNode) {
      errors.push(`Edge source node "${edge.from.nodeId}" not found`);
      return;
    }
    if (!toNode) {
      errors.push(`Edge target node "${edge.to.nodeId}" not found`);
      return;
    }

    const fromDef = DEFAULT_BLOCK_DEFS.get(fromNode.defId);
    const toDef = DEFAULT_BLOCK_DEFS.get(toNode.defId);

    if (!fromDef || !toDef) return; // Already reported above

    const fromPort = fromDef.outputs.find((p) => p.id === edge.from.portId);
    const toPort = toDef.inputs.find((p) => p.id === edge.to.portId);

    if (!fromPort) {
      errors.push(`Output port "${edge.from.portId}" not found on block "${fromDef.id}"`);
    }
    if (!toPort) {
      errors.push(`Input port "${edge.to.portId}" not found on block "${toDef.id}"`);
    }

    // Type checking (if not "any")
    if (fromPort && toPort && fromPort.type !== "any" && toPort.type !== "any") {
      if (fromPort.type !== toPort.type) {
        errors.push(
          `Type mismatch on edge: "${fromPort.type}" (${fromNode.id}.${edge.from.portId}) ` +
            `-> "${toPort.type}" (${toNode.id}.${edge.to.portId})`
        );
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Evaluate a block program by traversing the AST and executing blocks.
 * Returns the final result from the root node.
 */
export async function evaluateProgram(program: BlockProgram): Promise<EvalResult> {
  const validation = validateProgram(program);
  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid program: ${validation.errors.join("; ")}`,
    };
  }

  const rootNode = program.nodes.find((n) => n.id === program.rootNodeId);
  if (!rootNode) {
    return { success: false, error: "Root node not found" };
  }

  const context: ExecutionContext = {
    program,
    definitions: DEFAULT_BLOCK_DEFS,
    nodeValues: new Map(),
    depth: 0,
    maxDepth: MAX_EXECUTION_DEPTH,
  };

  return evaluateNode(rootNode, context);
}

/**
 * Evaluate a single block node and its dependencies.
 * Recursively evaluates input nodes first.
 */
export async function evaluateNode(node: BlockNode, context: ExecutionContext): Promise<EvalResult> {
  if (context.depth > (context.maxDepth ?? MAX_EXECUTION_DEPTH)) {
    return {
      success: false,
      error: "Max execution depth exceeded (infinite loop?)",
    };
  }

  // Return cached result if already evaluated
  const cached = context.nodeValues.get(node.id);
  if (cached) return cached;

  const blockDef = context.definitions.get(node.defId);
  if (!blockDef) {
    return { success: false, error: `Block definition "${node.defId}" not found` };
  }

  // Evaluate all input edges first
  const inputValues: Record<string, any> = {};

  const incomingEdges = context.program.edges.filter((e) => e.to.nodeId === node.id);

  for (const edge of incomingEdges) {
    const sourceNode = context.program.nodes.find((n) => n.id === edge.from.nodeId);
    if (!sourceNode) continue;

    context.depth++;
    const sourceResult = await evaluateNode(sourceNode, context);
    context.depth--;

    if (!sourceResult.success) {
      return { success: false, error: `Failed to evaluate upstream node: ${sourceResult.error}` };
    }

    // Get the output value from source port
    const sourcePort = blockDef.inputs.find((p) => p.id === edge.to.portId);
    if (sourcePort) {
      inputValues[edge.to.portId] =
        sourceResult.outputPortValues?.[edge.from.portId] ?? sourceResult.value;
    }
  }

  // Add default values for unconnected inputs
  blockDef.inputs.forEach((port) => {
    if (!(port.id in inputValues) && port.defaultValue !== undefined) {
      inputValues[port.id] = port.defaultValue;
    }
  });

  // Execute the block (defined by block library)
  const result = await executeBlock(blockDef, node, inputValues);
  context.nodeValues.set(node.id, result);

  return result;
}

/**
 * Execute a single block.
 * This delegates to block-specific logic (defined in block library).
 * Placeholder: real implementation would dispatch to block-specific handlers.
 */
async function executeBlock(
  _def: BlockDef,
  _node: BlockNode,
  _inputs: Record<string, any>
): Promise<EvalResult> {
  // TODO: Implement block-specific execution logic
  // Trigger/display/logic/data/action/transform handlers

  return {
    success: true,
    value: undefined,
    outputPortValues: {},
  };
}

/**
 * Get all blocks that depend on a given node.
 * Useful for invalidating cache when a node changes.
 */
export function getDependents(nodeId: string, program: BlockProgram): BlockNode[] {
  const dependentIds = new Set<string>();

  const collect = (id: string) => {
    const edges = program.edges.filter((e) => e.from.nodeId === id);
    edges.forEach((e) => {
      if (!dependentIds.has(e.to.nodeId)) {
        dependentIds.add(e.to.nodeId);
        collect(e.to.nodeId);
      }
    });
  };

  collect(nodeId);
  return program.nodes.filter((n) => dependentIds.has(n.id));
}
