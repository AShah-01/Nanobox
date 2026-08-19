import { getBlocksByCategory } from "../../integrations/blockEngine/blockLibrary";
import type { BlockDef } from "../../integrations/blockEngine/types";

interface BlockPaletteProps {
  onAdd: (def: BlockDef) => void;
}

/**
 * Click-to-add rather than drag-to-add: a click works with a keyboard and a
 * screen reader for free, which HTML5 drag-and-drop does not, and every
 * added block is immediately draggable on the canvas anyway.
 */
export function BlockPalette({ onAdd }: BlockPaletteProps) {
  const byCategory = getBlocksByCategory();

  return (
    <aside className="block-palette" aria-label="Block palette">
      {Object.entries(byCategory).map(([category, blocks]) => (
        <section key={category} className="block-palette__group">
          <h3 className="block-palette__heading">{category}</h3>
          <ul className="block-palette__list">
            {blocks.map((def) => (
              <li key={def.id}>
                <button type="button" className="block-palette__item" onClick={() => onAdd(def)} title={def.description}>
                  {def.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  );
}
