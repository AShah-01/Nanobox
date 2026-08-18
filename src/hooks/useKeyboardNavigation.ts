import { useEffect } from "react";

interface KeyboardAction {
  key: string;
  action: () => void;
  description?: string;
}

interface UseKeyboardNavigationOptions {
  enabled?: boolean;
  stopPropagation?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardNavigation(
  actions: KeyboardAction[],
  options: UseKeyboardNavigationOptions = {}
) {
  const { enabled = true, stopPropagation = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const action = actions.find((a) => {
        const keys = a.key.split("+");
        const hasCtrl = keys.includes("ctrl");
        const hasShift = keys.includes("shift");
        const hasAlt = keys.includes("alt");
        const baseKey = keys.find((k) => !["ctrl", "shift", "alt"].includes(k));

        return (
          event.key.toLowerCase() === baseKey?.toLowerCase() &&
          event.ctrlKey === hasCtrl &&
          event.shiftKey === hasShift &&
          event.altKey === hasAlt
        );
      });

      if (action) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        action.action();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions, enabled, stopPropagation, preventDefault]);
}

export function useFocusNavigation(selectorsOrElements: (string | HTMLElement)[], options?: UseKeyboardNavigationOptions) {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const elements = selectorsOrElements
      .map((item) => (typeof item === "string" ? document.querySelector(item) : item))
      .filter((el) => el !== null) as HTMLElement[];

    if (elements.length === 0) return;

    function handleKeyDown(event: KeyboardEvent) {
      const focusedElement = document.activeElement as HTMLElement;
      const currentIndex = elements.indexOf(focusedElement);

      if (event.key === "Tab") {
        event.preventDefault();
        const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
        const wrappedIndex = ((nextIndex % elements.length) + elements.length) % elements.length;
        elements[wrappedIndex].focus();
      }

      if (event.key === "ArrowUp" && currentIndex !== -1) {
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + elements.length) % elements.length;
        elements[prevIndex].focus();
      }

      if (event.key === "ArrowDown" && currentIndex !== -1) {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % elements.length;
        elements[nextIndex].focus();
      }
    }

    elements.forEach((el) => el.addEventListener("keydown", handleKeyDown));
    return () => {
      elements.forEach((el) => el.removeEventListener("keydown", handleKeyDown));
    };
  }, [selectorsOrElements, enabled]);
}

export function focusNextFocusableElement(reverse = false) {
  const focusableSelectors = [
    "button",
    "a[href]",
    "input",
    "textarea",
    "select",
    "[tabindex]:not([tabindex='-1'])",
  ];
  const focusableElements = Array.from(
    document.querySelectorAll(focusableSelectors.join(","))
  ) as HTMLElement[];

  const current = document.activeElement as HTMLElement;
  const currentIndex = focusableElements.indexOf(current);
  const nextIndex = reverse ? currentIndex - 1 : currentIndex + 1;
  const wrappedIndex = ((nextIndex % focusableElements.length) + focusableElements.length) % focusableElements.length;

  focusableElements[wrappedIndex]?.focus();
}
