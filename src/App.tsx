import { useEffect } from "react";
import { Clock } from "./widgets/built-in";
import { ensureAutostart } from "./core/autostart";
import { getDb } from "./storage/db";

function App() {
  useEffect(() => {
    ensureAutostart().catch((err) => console.error("autostart setup failed", err));
    getDb().catch((err) => console.error("db init failed", err));
  }, []);

  return (
    <main className="overlay">
      <Clock />
    </main>
  );
}

export default App;
