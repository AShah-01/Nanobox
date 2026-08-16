/** Minimal external store (no extra deps) so any widget can react to Focus Mode without prop drilling. */
type Listener = () => void;

let hideOthers = false;
const listeners = new Set<Listener>();

export function isHidingOthers() {
  return hideOthers;
}

export function setHideOthers(next: boolean) {
  hideOthers = next;
  listeners.forEach((l) => l());
}

export function subscribeFocusMode(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
