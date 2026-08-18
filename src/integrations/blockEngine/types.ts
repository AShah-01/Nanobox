/**
 * Block Engine — Visual Programming System
 * AST types for nodes, ports, edges, and programs
 */

export type BlockType =
  | "trigger" // Fire event: OnTimer, OnChange, OnEvent
  | "display" // Render output: ShowText, ShowNumber, ShowImage
  | "logic" // Conditionals: If/Else, Switch, Compare
  | "data" // Fetch: GetNow, GetNote, GetWeather
  | "action" // Do something: PlaySound, Notify, OpenApp
  | "transform"; // Compute: Format, Math, DateFormat

export type PortType = "string" | "number" | "boolean" | "array" | "any";

export interface Port {
  id: string;
  name: string;
  type: PortType;
  isInput: boolean;
  defaultValue?: string | number | boolean;
}

export interface BlockDef {
  id: string;
  type: BlockType;
  label: string;
  description: string;
  icon?: string;
  inputs: Port[];
  outputs: Port[];
  category?: string;
}

export interface BlockNode {
  id: string;
  defId: string; // Reference to BlockDef
  label: string;
  x: number;
  y: number;
  config?: Record<string, any>; // Block-specific settings (e.g., timer interval for OnTimer)
}

export interface Edge {
  id: string;
  from: { nodeId: string; portId: string };
  to: { nodeId: string; portId: string };
}

export interface BlockProgram {
  id: string;
  name: string;
  nodes: BlockNode[];
  edges: Edge[];
  rootNodeId: string; // First node to evaluate
  createdAt: number;
  updatedAt: number;
}

// Runtime evaluation result
export interface EvalResult {
  success: boolean;
  value?: any;
  error?: string;
  outputPortValues?: Record<string, any>; // { portId: value }
}

// Execution context during evaluation
export interface ExecutionContext {
  program: BlockProgram;
  definitions: Map<string, BlockDef>;
  nodeValues: Map<string, EvalResult>; // node.id -> result
  depth: number; // Recursion tracking
  maxDepth?: number; // Prevent infinite loops
}
