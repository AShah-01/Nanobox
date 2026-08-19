import { useCallback, useEffect, useState } from "react";
import { WidgetGrid } from "./widgets/WidgetGrid";
import { SettingsPanel } from "./components/SettingsPanel";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { TitleBar } from "./components/TitleBar";
import { OnboardingWizard, hasCompletedOnboarding } from "./components/OnboardingWizard";
import { ensureAutostart } from "./core/autostart";
import { getDb } from "./storage/db";
import { initGlobalKeyboardNav } from "./core/keyboardNav";
import { initContrast } from "./core/contrastStore";
import { getTheme, setTheme } from "./core/themeStore";
import { THEMES } from "./themes/themes";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import "./core/keyboardNav.css";

function cycleTheme(reverse: boolean) {
  const ids = THEMES.map((t) => t.id);
  const currentIndex = ids.indexOf(getTheme());
  const nextIndex = ((reverse ? currentIndex - 1 : currentIndex + 1) + ids.length) % ids.length;
  setTheme(ids[nextIndex]);
}

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    ensureAutostart().catch((err) => console.error("autostart setup failed", err));
    getDb()
      .then(() => hasCompletedOnboarding())
      .then(setOnboardingDone)
      .catch((err) => {
        console.error("db init failed", err);
        setOnboardingDone(true); // fail open — don't block the app on a broken DB
      });
    initContrast().catch((err) => console.error("contrast init failed", err));
    initGlobalKeyboardNav();
  }, []);

  const toggleAddWidget = useCallback(() => {
    window.dispatchEvent(new Event("nanobox:toggle-add-widget"));
  }, []);

  useKeyboardNavigation([
    { key: "ctrl+,", action: () => setSettingsOpen((v) => !v), description: "Toggle settings" },
    { key: "ctrl+shift+a", action: toggleAddWidget, description: "Add a widget" },
    { key: "ctrl+shift+t", action: () => cycleTheme(false), description: "Cycle to next theme" },
  ]);

  return (
    <main className="overlay">
      <TitleBar onSettingsClick={() => setSettingsOpen(true)} />
      <div className="overlay__body">
        {onboardingDone === false ? (
          <OnboardingWizard onComplete={() => setOnboardingDone(true)} />
        ) : (
          onboardingDone && (
            <>
              <WidgetGrid />
              <ThemeSwitcher />
            </>
          )
        )}
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </main>
  );
}

export default App;
