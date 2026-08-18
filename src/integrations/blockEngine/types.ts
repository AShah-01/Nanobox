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
  bridge: ExecutionBridge;
}

/**
 * Everything a block program needs from the outside world (OS/DB/live app
 * state) goes through this seam. Keeps the evaluator itself pure and
 * testable without a Tauri runtime — a widget renderer supplies a real
 * bridge; tests and the default bridge no-op or reject cleanly instead of
 * silently pretending to succeed.
 */
export interface ExecutionBridge {
  getNowPlaying?: () => Promise<{ track?: string; artist?: string; album?: string } | null>;
  getNote?: (noteId: string) => Promise<string | null>;
  getNextCalendarEvent?: () => Promise<{ id?: string; title?: string } | null>;
  playSound?: (file: string) => Promise<void>;
  sendNotification?: (title: string, body: string) => Promise<void>;
  openApp?: (appPath: string) => Promise<void>;
  setAlarm?: (time: string, label: string) => Promise<void>;
}

/** Bridge used when none is supplied: read-only blocks return null/empty, action blocks fail explicitly. */
export const NULL_BRIDGE: ExecutionBridge = {};
