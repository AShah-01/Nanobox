/**
 * In-memory registry of compiled custom-block bodies.
 *
 * Deliberately kept free of any storage/Tauri import so `evaluator.ts` can
 * reach it while staying runnable (and testable) outside a Tauri runtime.
 * `customBlockLoader.ts` is the piece that talks to SQLite and fills this in.
 *
 * Sandboxing: bodies are compiled with `new Function("inputs", body)`, so a
 * body sees only the evaluated input values and closes over nothing from the
 * app. It can still reach globals — true isolation needs ShadowRealm (not yet
 * broadly available) or a worker/iframe. Isolation is by convention for now:
 * bodies are authored locally by the user, never fetched from elsewhere.
 */

/** Custom def ids are namespaced so the evaluator can spot them by prefix. */
export const CUSTOM_DEF_PREFIX = "custom/";

export function isCustomDefId(defId: string): boolean {
  return defId.startsWith(CUSTOM_DEF_PREFIX);
}

/** Hard ceiling on body size, matching what the creator UI enforces. */
export const MAX_JS_BODY_BYTES = 8 * 1024;

export type CustomBlockEvaluator = (inputs: Record<string, unknown>) => unknown;

const EVALUATORS = new Map<string, CustomBlockEvaluator>();

/** Compiles a body string, throwing a SyntaxError if it doesn't parse. */
export function compileCustomBlockBody(jsBody: string): CustomBlockEvaluator {
  return new Function("inputs", jsBody) as CustomBlockEvaluator;
}

export function setCustomBlockEvaluator(defId: string, run: CustomBlockEvaluator): void {
  EVALUATORS.set(defId, run);
}

/** Returns the compiled runner for a custom block, or undefined if none is registered. */
export function getCustomBlockEvaluator(defId: string): CustomBlockEvaluator | undefined {
  return EVALUATORS.get(defId);
}

export function unregisterCustomBlockEvaluator(defId: string): void {
  EVALUATORS.delete(defId);
}
