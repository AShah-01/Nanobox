import { useEffect } from "react";
import { WidgetGrid } from "./widgets/WidgetGrid";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { ensureAutostart } from "./core/autostart";
import { getDb } from "./storage/db";

function App() {
  useEffect(() => {
    ensureAutostart().catch((err) => console.error("autostart setup failed", err));
    getDb().catch((err) => console.error("db init failed", err));
  }, []);

  return (
    <main className="overlay">
      <WidgetGrid />
      <ThemeSwitcher />
    </main>
  );
}

export default App;
