# Block Engine Guide

The block engine is Nanobox's visual-programming system: wire together small
typed blocks (triggers, data, logic, transforms, actions, display) into a
program the app can run. It's the planned successor to the sandboxed Custom
Widget (HTML/CSS/JS) — same idea of "extend Nanobox without touching core,"
lower ceiling but much lower floor.

**Status:** the AST, evaluator, standard library, and real per-block
execution logic are implemented (`src/integrations/blockEngine/`). The
React Flow visual canvas, block palette UI, and widget renderer that runs a
saved program as a live desktop widget are not built yet — today the engine
is usable from code/tests, not yet from the UI.

## Files

```
src/integrations/blockEngine/
├── types.ts         # AST types: BlockDef, BlockNode, Edge, BlockProgram,
│                     # ExecutionContext, ExecutionBridge
├── evaluator.ts      # validateProgram, evaluateProgram, evaluateNode,
│                     # executeBlock (per-block logic), getDependents
└── blockLibrary.ts   # 23 standard block definitions + registerBlockDef /
                       # initBlockLibrary / getBlocksByCategory
```

## Core concepts

- **`BlockDef`** — a block's *type*: its category (`trigger` / `display` /
  `logic` / `data` / `action` / `transform`), typed input/output ports, and
  metadata. Registered once via `registerBlockDef()`.
- **`BlockNode`** — one *instance* of a `BlockDef` placed on the canvas, with
  its own `id`, position, and optional `config` (e.g. which comparison
  operator a Compare block uses).
- **`Edge`** — a typed wire from one node's output port to another node's
  input port.
- **`BlockProgram`** — the whole graph: `nodes` + `edges` + a `rootNodeId`
  (the block whose value the program evaluates to).
- **Port types** — `string | number | boolean | array | any`. Two ports can
  only be wired together if their types match, or either side is `any`.

## Evaluation model

`evaluateProgram(program, bridge?)`:

1. Runs `validateProgram()` first — checks every node's `defId` is
   registered, every edge references real nodes/ports, and connected ports
   have matching types. Returns a list of human-readable errors if not.
2. Walks the graph from `rootNodeId`, recursively evaluating upstream nodes
   before downstream ones (`evaluateNode`), depth-limited to 100 to catch
   accidental cycles.
3. Each node's result is cached in `context.nodeValues` for the duration of
   one evaluation, so a value feeding two downstream blocks is only
   computed once.
4. `executeBlock()` is the big switch statement with the actual per-block
   behaviour — see below.

```ts
import { evaluateProgram } from "./src/integrations/blockEngine/evaluator";
import { initBlockLibrary } from "./src/integrations/blockEngine/blockLibrary";

initBlockLibrary(); // registers all 23 standard blocks once, at startup

const result = await evaluateProgram(myProgram, myBridge);
// { success: true, value: ..., outputPortValues: { ... } }
// or { success: false, error: "..." }
```

## The bridge: keeping the evaluator pure

Pure/computational blocks (display, logic, transform, `GetCurrentTime`) run
directly with no side effects. Blocks that need something from the outside
world — the currently-playing track, a note's contents, sending a
notification — go through an `ExecutionBridge` instead of calling Tauri/DB
APIs directly:

```ts
export interface ExecutionBridge {
  getNowPlaying?: () => Promise<{ track?: string; artist?: string; album?: string } | null>;
  getNote?: (noteId: string) => Promise<string | null>;
  getNextCalendarEvent?: () => Promise<{ id?: string; title?: string } | null>;
  playSound?: (file: string) => Promise<void>;
  sendNotification?: (title: string, body: string) => Promise<void>;
  openApp?: (appPath: string) => Promise<void>;
  setAlarm?: (time: string, label: string) => Promise<void>;
}
```

This is what makes the evaluator unit-testable without a running Tauri app
(see `tests/integrations/blockEngine.test.ts`) — call `evaluateProgram()`
with no bridge (`NULL_BRIDGE`) and read-only blocks return `null`/empty
while action blocks fail explicitly (`"No sound bridge configured"`, etc.)
instead of throwing or silently pretending to succeed. A real widget
renderer supplies a bridge backed by actual Tauri commands.

## Standard library (23 blocks)

| Category | Blocks |
|---|---|
| Trigger | On Timer, On Calendar Event, On Music Change |
| Display | Show Text, Show Number, Show Image, Progress Bar |
| Logic | If/Else, Compare, Boolean AND, Boolean OR |
| Data | Get Current Time, Get Now Playing, Get Note |
| Action | Play Sound, Send Notification, Open App, Set Alarm |
| Transform | Format Text, Math Operation, Date Format, Join Strings |

Notes on specific blocks:

- **Compare** / **Math Operation** read their operator (`==`, `<`, `+`, `*`,
  ...) from `node.config?.operator`, not from a port — it's a fixed setting
  per node instance, not something you wire in.
- **Format Text** uses `{0}`, `{1}`, ... placeholders substituted by index
  from the `values` array input.
- **Date Format** supports `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss` tokens.
- **On Timer** returns a fresh timestamp on every evaluation — it's a
  pull-based snapshot, not a live push/subscription; something outside the
  engine (the eventual widget renderer) is responsible for re-evaluating on
  an interval.

## Adding a new block

1. Add a `BlockDef` to `blockLibrary.ts` (category, ports, description) and
   register it in `initBlockLibrary()`.
2. Add a `case` for its `id` in `executeBlock()` in `evaluator.ts`. If it
   needs live app/OS state, read it through `bridge` and fail explicitly
   when that bridge method isn't supplied — don't reach for a Tauri API
   directly from inside the evaluator.
3. Add a test in `tests/integrations/blockEngine.test.ts` covering both the
   success path and, for bridge-backed blocks, the no-bridge failure path.

## What's left

Tracked in `BACKLOG.md` / `ROADMAP.md` under the Block Engine milestone:

- React Flow canvas integration for the visual editor
- Wire validation feedback in the UI (type-mismatch tooltips)
- Block library panel (searchable, categorised, drag-to-canvas)
- Custom block creator with a Monaco Editor sandbox
- Block widget renderer — running a saved `BlockProgram` as a live desktop
  widget, wired to a real `ExecutionBridge`
- Block import/export as `.nnblock` JSON files
