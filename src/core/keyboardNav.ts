/**
 * Global keyboard navigation manager.
 * Ensures all interactive elements are reachable via Tab/Shift+Tab.
 * Escape closes modals.
 */

export function initGlobalKeyboardNav() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      // Close all modals
      const modals = document.querySelectorAll(
        "[role='dialog'], .settings-panel__overlay, .focus-widget__settings"
      );
      modals.forEach((modal) => {
        const closeBtn = modal.querySelector("button[aria-label='Close']");
        if (closeBtn) (closeBtn as HTMLButtonElement).click();
      });
    }
  });

  // Ensure all interactive elements are focusable
  const focusableSelectors = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    "[role='button']:not([aria-disabled='true'])",
    "[role='slider']",
  ];

  document.querySelectorAll(focusableSelectors.join(", ")).forEach((el) => {
    if (!el.hasAttribute("tabindex")) {
      el.setAttribute("tabindex", "0");
    }
  });

  // Add focus ring styling support (CSS will handle visibility)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      document.body.classList.add("keyboard-focus");
    }
  });

  document.addEventListener("mousedown", () => {
    document.body.classList.remove("keyboard-focus");
  });
}
