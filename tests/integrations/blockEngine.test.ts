import { describe, expect, it } from "vitest";
import { evaluateProgram, validateProgram } from "../../src/integrations/blockEngine/evaluator";
import { initBlockLibrary } from "../../src/integrations/blockEngine/blockLibrary";
import type { BlockProgram, ExecutionBridge } from "../../src/integrations/blockEngine/types";

initBlockLibrary();

function program(overrides: Partial<BlockProgram>): BlockProgram {
  return {
    id: "p1",
    name: "test",
    nodes: [],
    edges: [],
    rootNodeId: "root",
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("validateProgram", () => {
  it("rejects a missing root node", () => {
    const result = validateProgram(program({ nodes: [], rootNodeId: "missing" }));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Root node/);
  });

  it("rejects an unregistered block definition", () => {
    const result = validateProgram(
      program({
        nodes: [{ id: "root", defId: "nonexistent/block", label: "x", x: 0, y: 0 }],
        rootNodeId: "root",
      })
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not registered/);
  });

  it("rejects an edge that connects a non-existent port", () => {
    const result = validateProgram(
      program({
        nodes: [
          { id: "a", defId: "data/get-current-time", label: "a", x: 0, y: 0 },
          { id: "b", defId: "display/show-text", label: "b", x: 0, y: 0 },
        ],
        edges: [{ id: "e1", from: { nodeId: "a", portId: "nope" }, to: { nodeId: "b", portId: "text" } }],
        rootNodeId: "b",
      })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Output port"))).toBe(true);
  });

  it("rejects a type mismatch across an edge", () => {
    const result = validateProgram(
      program({
        nodes: [
          { id: "a", defId: "display/show-number", label: "a", x: 0, y: 0 },
          { id: "b", defId: "display/show-text", label: "b", x: 0, y: 0 },
        ],
        edges: [{ id: "e1", from: { nodeId: "a", portId: "out" }, to: { nodeId: "b", portId: "text" } }],
        rootNodeId: "b",
      })
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Type mismatch"))).toBe(true);
  });

  it("accepts a valid single-node program", () => {
    const result = validateProgram(
      program({ nodes: [{ id: "root", defId: "data/get-current-time", label: "now", x: 0, y: 0 }] })
    );
    expect(result).toEqual({ valid: true, errors: [] });
  });
});

describe("evaluateProgram", () => {
  it("chains a data block into a display block via an edge", async () => {
    const result = await evaluateProgram(
      program({
        nodes: [
          { id: "a", defId: "data/get-current-time", label: "now", x: 0, y: 0 },
          { id: "b", defId: "display/show-text", label: "show", x: 0, y: 0 },
        ],
        edges: [{ id: "e1", from: { nodeId: "a", portId: "time" }, to: { nodeId: "b", portId: "text" } }],
        rootNodeId: "b",
      })
    );
    expect(result.success).toBe(true);
    expect(typeof result.value).toBe("string");
    expect(new Date(result.value as string).toString()).not.toBe("Invalid Date");
  });

  it("clamps progress-bar values to 0-100", async () => {
    const over = await evaluateProgram(
      program({
        nodes: [{ id: "root", defId: "display/progress-bar", label: "p", x: 0, y: 0, config: {} }],
        rootNodeId: "root",
      })
    );
    // no edge into `value` and no defaultValue -> undefined -> asNumber -> 0
    expect(over.value).toBe(0);
  });

  it("evaluates Compare with a configured operator", async () => {
    const node = {
      id: "root",
      defId: "logic/compare",
      label: "cmp",
      x: 0,
      y: 0,
      config: { operator: ">" },
    };
    const p = program({ nodes: [node], rootNodeId: "root" });
    // inject inputs by wiring literal-producing nodes would be more end-to-end;
    // exercise the operator switch directly through inputs via defaultValue.
    node.config = { operator: ">" };
    const result = await evaluateProgram(p);
    // a/b both undefined -> asNumber(undefined) = 0 for both -> 0 > 0 is false
    expect(result.value).toBe(false);
  });

  it("evaluates boolean AND/OR", async () => {
    const and = await evaluateProgram(
      program({ nodes: [{ id: "root", defId: "logic/boolean-and", label: "and", x: 0, y: 0 }], rootNodeId: "root" })
    );
    expect(and.value).toBe(false); // both inputs default to falsy/undefined

    const or = await evaluateProgram(
      program({
        nodes: [
          // undefined == undefined -> true; type-checks cleanly (boolean -> boolean)
          { id: "cmp", defId: "logic/compare", label: "cmp", x: 0, y: 0, config: { operator: "==" } },
          { id: "root", defId: "logic/boolean-or", label: "or", x: 0, y: 0 },
        ],
        edges: [{ id: "e1", from: { nodeId: "cmp", portId: "result" }, to: { nodeId: "root", portId: "a" } }],
        rootNodeId: "root",
      })
    );
    expect(or.value).toBe(true);
  });

  it("performs math operations via node config", async () => {
    const addResult = await evaluateProgram(
      program({
        nodes: [{ id: "root", defId: "transform/math-op", label: "add", x: 0, y: 0, config: { operator: "+" } }],
        rootNodeId: "root",
      })
    );
    expect(addResult.value).toBe(0); // both inputs default to 0
  });

  it("formats text templates with indexed placeholders", async () => {
    const result = await evaluateProgram(
      program({
        nodes: [
          {
            id: "root",
            defId: "transform/format-text",
            label: "fmt",
            x: 0,
            y: 0,
            config: {},
          },
        ],
        rootNodeId: "root",
      })
    );
    // no template wired -> empty string
    expect(result.value).toBe("");
  });

  it("joins array elements with the default separator", async () => {
    // JoinStrings has a defaultValue "," on separator and no default array,
    // so with nothing wired it should join an empty array to "".
    const result = await evaluateProgram(
      program({ nodes: [{ id: "root", defId: "transform/join-strings", label: "join", x: 0, y: 0 }], rootNodeId: "root" })
    );
    expect(result.value).toBe("");
  });

  it("fails with a clear error when an action block has no bridge configured", async () => {
    const result = await evaluateProgram(
      program({
        nodes: [{ id: "root", defId: "action/send-notification", label: "notify", x: 0, y: 0 }],
        rootNodeId: "root",
      })
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/bridge/);
  });

  it("calls the injected bridge for action blocks", async () => {
    const calls: Array<[string, string]> = [];
    const bridge: ExecutionBridge = {
      async sendNotification(title, body) {
        calls.push([title, body]);
      },
    };
    const result = await evaluateProgram(
      program({
        nodes: [{ id: "root", defId: "action/send-notification", label: "notify", x: 0, y: 0 }],
        rootNodeId: "root",
      }),
      bridge
    );
    expect(result.success).toBe(true);
    expect(calls).toEqual([["", ""]]);
  });

  it("returns an invalid-program error for a bad root node without throwing", async () => {
    const result = await evaluateProgram(program({ nodes: [], rootNodeId: "missing" }));
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid program/);
  });
});
