import { useEffect } from "react";
import { WidgetGrid } from "./widgets/WidgetGrid";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { TitleBar } from "./components/TitleBar";
import { ensureAutostart } from "./core/autostart";
import { getDb } from "./storage/db";

function App() {
  useEffect(() => {
    ensureAutostart().catch((err) => console.error("autostart setup failed", err));
    getDb().catch((err) => console.error("db init failed", err));
  }, []);

  return (
    <main className="overlay">
      <TitleBar />
      <div className="overlay__body">
        <WidgetGrid />
        <ThemeSwitcher />
      </div>
    </main>
  );
}

export default App;
