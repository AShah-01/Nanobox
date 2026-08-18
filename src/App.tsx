import { useEffect, useState } from "react";
import { WidgetGrid } from "./widgets/WidgetGrid";
import { SettingsPanel } from "./components/SettingsPanel";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { TitleBar } from "./components/TitleBar";
import { ensureAutostart } from "./core/autostart";
import { getDb } from "./storage/db";
import { initGlobalKeyboardNav } from "./core/keyboardNav";
import "./core/keyboardNav.css";

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    ensureAutostart().catch((err) => console.error("autostart setup failed", err));
    getDb().catch((err) => console.error("db init failed", err));
    initGlobalKeyboardNav();
  }, []);

  return (
    <main className="overlay">
      <TitleBar onSettingsClick={() => setSettingsOpen(true)} />
      <div className="overlay__body">
        <WidgetGrid />
        <ThemeSwitcher />
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </main>
  );
}

export default App;
