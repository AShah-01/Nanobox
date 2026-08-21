import type { BlockDef } from "./types";
import { getBlockDefs, registerBlockDef } from "./evaluator";

/**
 * Standard block library.
 * Define all built-in blocks that users can drag onto the canvas.
 */

// ============ TRIGGER BLOCKS ============

export const OnTimer: BlockDef = {
  id: "trigger/on-timer",
  type: "trigger",
  label: "On Timer",
  description: "Fire every N seconds",
  category: "Triggers",
  inputs: [],
  outputs: [{ id: "tick", name: "Tick", type: "any", isInput: false }],
};

export const OnCalendarEvent: BlockDef = {
  id: "trigger/on-calendar-event",
  type: "trigger",
  label: "On Calendar Event",
  description: "Fire when a calendar event occurs",
  category: "Triggers",
  inputs: [],
  outputs: [
    { id: "event", name: "Event", type: "any", isInput: false },
    { id: "title", name: "Title", type: "string", isInput: false },
  ],
};

export const OnMusicChange: BlockDef = {
  id: "trigger/on-music-change",
  type: "trigger",
  label: "On Music Change",
  description: "Fire when now-playing track changes",
  category: "Triggers",
  inputs: [],
  outputs: [
    { id: "track", name: "Track", type: "any", isInput: false },
    { id: "artist", name: "Artist", type: "string", isInput: false },
  ],
};

// ============ DISPLAY BLOCKS ============

export const ShowText: BlockDef = {
  id: "display/show-text",
  type: "display",
  label: "Show Text",
  description: "Display text output",
  category: "Display",
  inputs: [{ id: "text", name: "Text", type: "string", isInput: true }],
  outputs: [{ id: "out", name: "Output", type: "string", isInput: false }],
};

export const ShowNumber: BlockDef = {
  id: "display/show-number",
  type: "display",
  label: "Show Number",
  description: "Display numeric output",
  category: "Display",
  inputs: [{ id: "value", name: "Value", type: "number", isInput: true }],
  outputs: [{ id: "out", name: "Output", type: "number", isInput: false }],
};

export const ShowImage: BlockDef = {
  id: "display/show-image",
  type: "display",
  label: "Show Image",
  description: "Display an image from URL",
  category: "Display",
  inputs: [{ id: "url", name: "URL", type: "string", isInput: true }],
  outputs: [{ id: "out", name: "Image", type: "any", isInput: false }],
};

export const ProgressBar: BlockDef = {
  id: "display/progress-bar",
  type: "display",
  label: "Progress Bar",
  description: "Display progress (0-100)",
  category: "Display",
  inputs: [{ id: "value", name: "Percent", type: "number", isInput: true }],
  outputs: [{ id: "out", name: "Display", type: "any", isInput: false }],
};

// ============ LOGIC BLOCKS ============

export const IfElse: BlockDef = {
  id: "logic/if-else",
  type: "logic",
  label: "If / Else",
  description: "Conditional branching",
  category: "Logic",
  inputs: [{ id: "condition", name: "Condition", type: "boolean", isInput: true }],
  outputs: [
    { id: "true", name: "True", type: "any", isInput: false },
    { id: "false", name: "False", type: "any", isInput: false },
  ],
};

export const Compare: BlockDef = {
  id: "logic/compare",
  type: "logic",
  label: "Compare",
  description: "Compare two values (==, !=, <, >, <=, >=)",
  category: "Logic",
  inputs: [
    { id: "a", name: "A", type: "any", isInput: true },
    { id: "b", name: "B", type: "any", isInput: true },
  ],
  outputs: [{ id: "result", name: "Result", type: "boolean", isInput: false }],
};

export const BooleanAnd: BlockDef = {
  id: "logic/boolean-and",
  type: "logic",
  label: "AND",
  description: "Logical AND",
  category: "Logic",
  inputs: [
    { id: "a", name: "A", type: "boolean", isInput: true },
    { id: "b", name: "B", type: "boolean", isInput: true },
  ],
  outputs: [{ id: "result", name: "Result", type: "boolean", isInput: false }],
};

export const BooleanOr: BlockDef = {
  id: "logic/boolean-or",
  type: "logic",
  label: "OR",
  description: "Logical OR",
  category: "Logic",
  inputs: [
    { id: "a", name: "A", type: "boolean", isInput: true },
    { id: "b", name: "B", type: "boolean", isInput: true },
  ],
  outputs: [{ id: "result", name: "Result", type: "boolean", isInput: false }],
};

// ============ DATA BLOCKS ============

export const GetCurrentTime: BlockDef = {
  id: "data/get-current-time",
  type: "data",
  label: "Get Current Time",
  description: "Get current time as ISO string",
  category: "Data",
  inputs: [],
  outputs: [{ id: "time", name: "Time", type: "string", isInput: false }],
};

export const GetNowPlaying: BlockDef = {
  id: "data/get-now-playing",
  type: "data",
  label: "Get Now Playing",
  description: "Get current track playing",
  category: "Data",
  inputs: [],
  outputs: [
    { id: "track", name: "Track", type: "any", isInput: false },
    { id: "artist", name: "Artist", type: "string", isInput: false },
    { id: "album", name: "Album", type: "string", isInput: false },
  ],
};

export const GetNote: BlockDef = {
  id: "data/get-note",
  type: "data",
  label: "Get Note",
  description: "Get note content by ID",
  category: "Data",
  inputs: [{ id: "noteId", name: "Note ID", type: "string", isInput: true }],
  outputs: [{ id: "content", name: "Content", type: "string", isInput: false }],
};

// ============ ACTION BLOCKS ============

export const PlaySound: BlockDef = {
  id: "action/play-sound",
  type: "action",
  label: "Play Sound",
  description: "Play an audio file",
  category: "Actions",
  inputs: [{ id: "file", name: "File Path", type: "string", isInput: true }],
  outputs: [{ id: "done", name: "Done", type: "any", isInput: false }],
};

export const SendNotification: BlockDef = {
  id: "action/send-notification",
  type: "action",
  label: "Send Notification",
  description: "Show a desktop notification",
  category: "Actions",
  inputs: [
    { id: "title", name: "Title", type: "string", isInput: true },
    { id: "body", name: "Body", type: "string", isInput: true },
  ],
  outputs: [{ id: "done", name: "Done", type: "any", isInput: false }],
};

export const OpenApp: BlockDef = {
  id: "action/open-app",
  type: "action",
  label: "Open App",
  description: "Launch an application",
  category: "Actions",
  inputs: [{ id: "appPath", name: "App Path", type: "string", isInput: true }],
  outputs: [{ id: "done", name: "Done", type: "any", isInput: false }],
};

export const SetAlarm: BlockDef = {
  id: "action/set-alarm",
  type: "action",
  label: "Set Alarm",
  description: "Set an alarm for a time",
  category: "Actions",
  inputs: [
    { id: "time", name: "Time", type: "string", isInput: true },
    { id: "label", name: "Label", type: "string", isInput: true },
  ],
  outputs: [{ id: "done", name: "Done", type: "any", isInput: false }],
};

// ============ TRANSFORM BLOCKS ============

export const FormatText: BlockDef = {
  id: "transform/format-text",
  type: "transform",
  label: "Format Text",
  description: "Format text with template",
  category: "Transform",
  inputs: [
    { id: "template", name: "Template", type: "string", isInput: true },
    { id: "values", name: "Values", type: "array", isInput: true },
  ],
  outputs: [{ id: "result", name: "Result", type: "string", isInput: false }],
};

export const MathOp: BlockDef = {
  id: "transform/math-op",
  type: "transform",
  label: "Math Operation",
  description: "Perform math: +, -, *, /, %",
  category: "Transform",
  inputs: [
    { id: "a", name: "A", type: "number", isInput: true },
    { id: "b", name: "B", type: "number", isInput: true },
  ],
  outputs: [{ id: "result", name: "Result", type: "number", isInput: false }],
};

export const DateFormat: BlockDef = {
  id: "transform/date-format",
  type: "transform",
  label: "Date Format",
  description: "Format date/time string",
  category: "Transform",
  inputs: [
    { id: "date", name: "Date", type: "string", isInput: true },
    { id: "format", name: "Format", type: "string", isInput: true },
  ],
  outputs: [{ id: "result", name: "Result", type: "string", isInput: false }],
};

export const JoinStrings: BlockDef = {
  id: "transform/join-strings",
  type: "transform",
  label: "Join Strings",
  description: "Join array of strings",
  category: "Transform",
  inputs: [
    { id: "array", name: "Array", type: "array", isInput: true },
    { id: "separator", name: "Separator", type: "string", isInput: true, defaultValue: "," },
  ],
  outputs: [{ id: "result", name: "Result", type: "string", isInput: false }],
};

/**
 * Initialize standard block library.
 */
export function initBlockLibrary() {
  // Triggers
  registerBlockDef(OnTimer);
  registerBlockDef(OnCalendarEvent);
  registerBlockDef(OnMusicChange);

  // Display
  registerBlockDef(ShowText);
  registerBlockDef(ShowNumber);
  registerBlockDef(ShowImage);
  registerBlockDef(ProgressBar);

  // Logic
  registerBlockDef(IfElse);
  registerBlockDef(Compare);
  registerBlockDef(BooleanAnd);
  registerBlockDef(BooleanOr);

  // Data
  registerBlockDef(GetCurrentTime);
  registerBlockDef(GetNowPlaying);
  registerBlockDef(GetNote);

  // Actions
  registerBlockDef(PlaySound);
  registerBlockDef(SendNotification);
  registerBlockDef(OpenApp);
  registerBlockDef(SetAlarm);

  // Transform
  registerBlockDef(FormatText);
  registerBlockDef(MathOp);
  registerBlockDef(DateFormat);
  registerBlockDef(JoinStrings);
}

/**
 * All registered blocks grouped by category. Reads the live registry rather
 * than a hardcoded list so user-authored custom blocks (registered by
 * `customBlockLoader`) show up in the palette alongside the built-ins.
 */
export function getBlocksByCategory(): Record<string, BlockDef[]> {
  return [...getBlockDefs().values()].reduce(
    (acc, block) => {
      const cat = block.category ?? "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(block);
      return acc;
    },
    {} as Record<string, BlockDef[]>,
  );
}
