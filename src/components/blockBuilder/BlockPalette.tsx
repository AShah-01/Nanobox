import { getBlocksByCategory } from "../../integrations/blockEngine/blockLibrary";
import { isCustomDefId } from "../../integrations/blockEngine/customBlockRegistry";
import type { BlockDef } from "../../integrations/blockEngine/types";

interface BlockPaletteProps {
  onAdd: (def: BlockDef) => void;
  /** Opens the custom block creator for a blank definition. */
  onCreateCustom: () => void;
  /** Opens the creator for an existing custom block, by its `custom/` def id. */
  onEditCustom: (defId: string) => void;
}

/**
 * Click-to-add rather than drag-to-add: a click works with a keyboard and a
 * screen reader for free, which HTML5 drag-and-drop does not, and every
 * added block is immediately draggable on the canvas anyway.
 */
export function BlockPalette({ onAdd, onCreateCustom, onEditCustom }: BlockPaletteProps) {
  const byCategory = getBlocksByCategory();

  return (
    <aside className="block-palette" aria-label="Block palette">
      {Object.entries(byCategory).map(([category, blocks]) => (
        <section key={category} className="block-palette__group">
          <h3 className="block-palette__heading">{category}</h3>
          <ul className="block-palette__list">
            {blocks.map((def) => (
              <li key={def.id} className="block-palette__row">
                <button type="button" className="block-palette__item" onClick={() => onAdd(def)} title={def.description}>
                  {def.label}
                </button>
                {isCustomDefId(def.id) && (
                  <button
                    type="button"
                    className="block-palette__edit"
                    onClick={() => onEditCustom(def.id)}
                    aria-label={`Edit ${def.label}`}
                    title={`Edit ${def.label}`}
                  >
                    Edit
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <button type="button" className="block-palette__new" onClick={onCreateCustom}>
        + New custom block
      </button>
    </aside>
  );
}
