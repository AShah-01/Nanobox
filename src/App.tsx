import { useEffect } from "react";
import { WidgetGrid } from "./widgets/WidgetGrid";
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
    </main>
  );
}

export default App;
