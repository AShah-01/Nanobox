import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PortType } from "../../integrations/blockEngine/types";
import type { CanvasNode } from "../../integrations/blockEngine/canvasAdapter";

/**
 * Each port type gets its own handle colour so a wrong connection is
 * obvious before you attempt it — the canvas also refuses incompatible
 * drops (see `isConnectionValid`), but colour makes the rule legible
 * rather than just enforced.
 */
const PORT_COLORS: Record<PortType, string> = {
  string: "#7cc4ff",
  number: "#ffc86b",
  boolean: "#8de08d",
  array: "#d79cff",
  any: "#9a9db0",
};

export function BlockNodeView({ data, selected }: NodeProps<CanvasNode>) {
  const { def, label } = data;

  return (
    <div className={`block-node block-node--${def.type}${selected ? " block-node--selected" : ""}`}>
      <div className="block-node__header">
        <span className="block-node__type">{def.type}</span>
        <span className="block-node__label">{label}</span>
      </div>

      <div className="block-node__ports">
        <ul className="block-node__col block-node__col--in">
          {def.inputs.map((port, i) => (
            <li key={port.id} className="block-node__port">
              <Handle
                id={port.id}
                type="target"
                position={Position.Left}
                style={{ top: portOffset(i), background: PORT_COLORS[port.type] }}
                title={`${port.name} (${port.type})`}
              />
              <span className="block-node__port-name">{port.name}</span>
            </li>
          ))}
        </ul>

        <ul className="block-node__col block-node__col--out">
          {def.outputs.map((port, i) => (
            <li key={port.id} className="block-node__port block-node__port--out">
              <span className="block-node__port-name">{port.name}</span>
              <Handle
                id={port.id}
                type="source"
                position={Position.Right}
                style={{ top: portOffset(i), background: PORT_COLORS[port.type] }}
                title={`${port.name} (${port.type})`}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Handles are absolutely positioned by React Flow, so rows are laid out by hand. */
function portOffset(index: number): number {
  return 44 + index * 22;
}
