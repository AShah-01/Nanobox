import Database from "@tauri-apps/plugin-sql";

let dbPromise: Promise<Database> | null = null;

/**
 * Opens (or reuses) the app's local SQLite database. Schema is created via
 * the Rust-side migration registered in src-tauri/src/lib.rs, so this just
 * connects — it never issues DDL itself.
 */
export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:nanobox.db");
  }
  return dbPromise;
}
