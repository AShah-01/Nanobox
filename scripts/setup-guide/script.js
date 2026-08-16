const toggleButtons = document.querySelectorAll(".platform-toggle__btn");
const toast = document.getElementById("toast");
let toastTimer;

function setPlatform(platform) {
  toggleButtons.forEach((btn) => {
    const active = btn.dataset.platform === platform;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  document.querySelectorAll("[data-platform-only]").forEach((el) => {
    el.hidden = el.dataset.platformOnly !== platform;
  });

  document.querySelectorAll("code[data-platform]").forEach((el) => {
    el.hidden = el.dataset.platform !== platform;
  });

  document.querySelectorAll(".platform-only[data-platform]").forEach((el) => {
    el.hidden = el.dataset.platform !== platform;
  });

  localStorage.setItem("nanobox-guide-platform", platform);
}

toggleButtons.forEach((btn) => {
  btn.addEventListener("click", () => setPlatform(btn.dataset.platform));
});

document.querySelectorAll(".code[data-copy]").forEach((block) => {
  block.addEventListener("click", async () => {
    const visibleCode = block.querySelector("code:not([hidden])") ?? block.querySelector("code");
    const text = visibleCode.textContent.trim();
    try {
      await navigator.clipboard.writeText(text);
      showToast();
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — selection still lets the user copy manually.
      const range = document.createRange();
      range.selectNodeContents(visibleCode);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
});

function showToast() {
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1200);
}

const guessedPlatform = navigator.userAgent.includes("Mac") ? "macos" : "windows";
setPlatform(localStorage.getItem("nanobox-guide-platform") || guessedPlatform);
