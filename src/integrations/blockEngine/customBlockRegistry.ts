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

/**
 * Maximum time budget for a single custom block evaluation. This check fires
 * AFTER the function returns — it cannot interrupt a true infinite loop
 * (`while(true){}`), which will still hang the tab. That case requires a Web
 * Worker, which needs a bundler config change deferred to a later milestone.
 * What this DOES catch: accidental slow loops that eventually finish but
 * take an unreasonable amount of time, surfacing them as errors on the next
 * evaluation tick instead of silently blocking the UI.
 */
export const CUSTOM_BLOCK_TIMEOUT_MS = 2_000;

/** Compiles a body string, throwing a SyntaxError if it doesn't parse. */
export function compileCustomBlockBody(jsBody: string): CustomBlockEvaluator {
  const inner = new Function("inputs", jsBody) as CustomBlockEvaluator;
  return function timedEvaluator(inputs: Record<string, unknown>): unknown {
    const start = Date.now();
    const result = inner(inputs);
    if (Date.now() - start > CUSTOM_BLOCK_TIMEOUT_MS) {
      throw new Error(`Custom block exceeded ${CUSTOM_BLOCK_TIMEOUT_MS}ms time budget`);
    }
    return result;
  };
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
