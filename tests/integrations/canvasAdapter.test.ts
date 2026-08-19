import { describe, it, expect } from "vitest";
import {
  flowToProgram,
  isConnectionValid,
  makeEdgeId,
  portsCompatible,
  programToFlow,
  type CanvasNode,
} from "../../src/integrations/blockEngine/canvasAdapter";
import { initBlockLibrary } from "../../src/integrations/blockEngine/blockLibrary";
import { getBlockDefs } from "../../src/integrations/blockEngine/evaluator";
import type { BlockProgram } from "../../src/integrations/blockEngine/types";

initBlockLibrary();
const defs = getBlockDefs();

function program(overrides: Partial<BlockProgram> = {}): BlockProgram {
  return {
    id: "p1",
    name: "Test",
    rootNodeId: "show",
    createdAt: 1000,
    updatedAt: 1000,
    nodes: [
      { id: "time", defId: "data/get-current-time", label: "Get Current Time", x: 10, y: 20 },
      { id: "show", defId: "display/show-text", label: "Show Text", x: 200, y: 20 },
    ],
    edges: [
      { id: "e1", from: { nodeId: "time", portId: "time" }, to: { nodeId: "show", portId: "text" } },
    ],
    ...overrides,
  };
}

function canvasNode(id: string, defId: string): CanvasNode {
  const def = defs.get(defId)!;
  return { id, type: "block", position: { x: 0, y: 0 }, data: { def, label: def.label } };
}

describe("portsCompatible", () => {
  it("matches identical types", () => {
    expect(portsCompatible("string", "string")).toBe(true);
    expect(portsCompatible("number", "string")).toBe(false);
  });

  it("treats any as a wildcard in both directions", () => {
    expect(portsCompatible("any", "number")).toBe(true);
    expect(portsCompatible("boolean", "any")).toBe(true);
  });
});

describe("programToFlow", () => {
  it("maps nodes and edges onto React Flow's shape", () => {
    const { nodes, edges } = programToFlow(program(), defs);

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({ id: "time", type: "block", position: { x: 10, y: 20 } });
    expect(nodes[0].data.def.id).toBe("data/get-current-time");

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      source: "time",
      sourceHandle: "time",
      target: "show",
      targetHandle: "text",
    });
  });

  it("drops nodes whose block definition is not registered rather than rendering a broken node", () => {
    const withGhost = program({
      nodes: [
        ...program().nodes,
        { id: "ghost", defId: "does/not-exist", label: "Ghost", x: 0, y: 0 },
      ],
    });

    const { nodes } = programToFlow(withGhost, defs);
    expect(nodes.map((n) => n.id)).toEqual(["time", "show"]);
  });

  it("derives an edge id when the stored edge has none", () => {
    const noId = program({
      edges: [{ id: "", from: { nodeId: "time", portId: "time" }, to: { nodeId: "show", portId: "text" } }],
    });

    expect(programToFlow(noId, defs).edges[0].id).toBe("time:time->show:text");
  });
});

describe("flowToProgram", () => {
  const base = { id: "p1", name: "Test", rootNodeId: "show", createdAt: 1000 };

  it("round-trips a program through the canvas shape and back", () => {
    const original = program();
    const flow = programToFlow(original, defs);
    const result = flowToProgram(base, flow.nodes, flow.edges);

    expect(result.nodes).toEqual(original.nodes);
    expect(result.edges).toEqual(original.edges);
    expect(result.rootNodeId).toBe("show");
    expect(result.createdAt).toBe(1000);
  });

  it("repoints rootNodeId at a surviving node when the old root was deleted", () => {
    const remaining = [canvasNode("time", "data/get-current-time")];
    expect(flowToProgram(base, remaining, []).rootNodeId).toBe("time");
  });

  it("keeps the stale rootNodeId when every node was deleted, so an empty canvas is not silently rewritten", () => {
    expect(flowToProgram(base, [], []).rootNodeId).toBe("show");
  });
});

describe("isConnectionValid", () => {
  const nodes = [canvasNode("time", "data/get-current-time"), canvasNode("show", "display/show-text")];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  it("accepts a compatible output → input pair", () => {
    const ok = isConnectionValid(
      { source: "time", sourceHandle: "time", target: "show", targetHandle: "text" },
      defs,
      byId,
    );
    expect(ok).toBe(true);
  });

  it("rejects a type mismatch", () => {
    const numbers = [...nodes, canvasNode("num", "display/show-number")];
    const map = new Map(numbers.map((n) => [n.id, n]));
    const ok = isConnectionValid(
      { source: "time", sourceHandle: "time", target: "num", targetHandle: "value" },
      defs,
      map,
    );
    expect(ok).toBe(false);
  });

  it("rejects self-connections and unknown handles", () => {
    expect(
      isConnectionValid({ source: "time", sourceHandle: "time", target: "time", targetHandle: "time" }, defs, byId),
    ).toBe(false);
    expect(
      isConnectionValid({ source: "time", sourceHandle: "nope", target: "show", targetHandle: "text" }, defs, byId),
    ).toBe(false);
  });

  it("rejects a connection whose node is not on the canvas", () => {
    expect(
      isConnectionValid({ source: "gone", sourceHandle: "time", target: "show", targetHandle: "text" }, defs, byId),
    ).toBe(false);
  });

  it("rejects an incomplete connection (a drag released on empty canvas)", () => {
    expect(isConnectionValid({ source: "time", sourceHandle: "time", target: null, targetHandle: null }, defs, byId)).toBe(
      false,
    );
  });
});

describe("makeEdgeId", () => {
  it("is stable and unique per port pair", () => {
    const id = makeEdgeId({ from: { nodeId: "a", portId: "out" }, to: { nodeId: "b", portId: "in" } });
    expect(id).toBe("a:out->b:in");
  });
});
