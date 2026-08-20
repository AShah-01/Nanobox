import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockWidget } from "../../src/widgets/built-in/BlockWidget/BlockWidget";
import { getBlockProgram, listBlockPrograms, type BlockProgramRow } from "../../src/storage/blockPrograms";
import { updateWidgetSettings, type WidgetInstance } from "../../src/storage/widgetInstances";
import type { BlockProgram } from "../../src/integrations/blockEngine/types";

vi.mock("../../src/storage/blockPrograms", () => ({
  listBlockPrograms: vi.fn(),
  getBlockProgram: vi.fn(),
}));

vi.mock("../../src/storage/widgetInstances", () => ({
  updateWidgetSettings: vi.fn().mockResolvedValue(undefined),
}));

// Real bridge.ts imports @tauri-apps/plugin-notification and plugin-opener,
// neither available in this jsdom test — swap in an inert stand-in, the same
// way tests/integrations/blockEngine.test.ts avoids importing bridge.ts at all.
vi.mock("../../src/integrations/blockEngine/bridge", () => ({ liveBridge: {} }));

const PROGRAM: BlockProgram = {
  id: "1",
  name: "Greeting",
  nodes: [
    { id: "a", defId: "data/get-current-time", label: "Now", x: 0, y: 0 },
    { id: "b", defId: "display/show-text", label: "Show", x: 200, y: 0 },
  ],
  edges: [{ id: "e1", from: { nodeId: "a", portId: "time" }, to: { nodeId: "b", portId: "text" } }],
  rootNodeId: "b",
  createdAt: 0,
  updatedAt: 0,
};

const PROGRAM_ROW: BlockProgramRow = {
  id: 1,
  name: "Greeting",
  program_json: JSON.stringify(PROGRAM),
  created_at: "2026-08-19T00:00:00Z",
  updated_at: "2026-08-19T00:00:00Z",
};

function makeInstance(overrides: Partial<WidgetInstance> = {}): WidgetInstance {
  return {
    id: 1,
    widget_type: "block-widget",
    x: 0,
    y: 0,
    w: 260,
    h: 220,
    opacity: 1,
    settings: null,
    style_settings: null,
    ...overrides,
  };
}

describe("BlockWidget", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("prompts for a program to run when the instance has no saved config", async () => {
    vi.mocked(listBlockPrograms).mockResolvedValue([PROGRAM_ROW]);

    render(<BlockWidget instance={makeInstance({ settings: null })} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("Program")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Greeting" })).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeDisabled();
  });

  it("runs the saved program and displays its root value", async () => {
    vi.mocked(listBlockPrograms).mockResolvedValue([PROGRAM_ROW]);
    vi.mocked(getBlockProgram).mockResolvedValue(PROGRAM_ROW);

    render(
      <BlockWidget
        instance={makeInstance({ settings: JSON.stringify({ programId: 1, intervalMs: 30_000 }) })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/^\d{4}-\d{2}-\d{2}T/)).toBeInTheDocument();
    });
    expect(screen.getAllByText("Greeting").length).toBeGreaterThan(0);
  });

  it("shows an error when the configured program was deleted", async () => {
    vi.mocked(listBlockPrograms).mockResolvedValue([]);
    vi.mocked(getBlockProgram).mockResolvedValue(null);

    render(
      <BlockWidget
        instance={makeInstance({ settings: JSON.stringify({ programId: 99, intervalMs: 30_000 }) })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("This program was deleted.")).toBeInTheDocument();
    });
  });

  it("saves the chosen program and interval", async () => {
    vi.mocked(listBlockPrograms).mockResolvedValue([PROGRAM_ROW]);
    vi.mocked(getBlockProgram).mockResolvedValue(PROGRAM_ROW);

    render(<BlockWidget instance={makeInstance({ settings: null })} />);

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.change(screen.getByLabelText("Program"), { target: { value: "1" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(updateWidgetSettings).toHaveBeenCalledWith(1, JSON.stringify({ programId: 1, intervalMs: 30_000 }));
    });
  });
});
