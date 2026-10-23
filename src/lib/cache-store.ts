import { getDb } from "./db";

export function listCache() {
  return getDb()
    .prepare("SELECT key, value, updated_at FROM cache_entries ORDER BY key")
    .all() as { key: string; value: string; updated_at: string }[];
}

export function setCache(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO cache_entries (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    )
    .run(key, value);
}

export function deleteCache(key: string) {
  getDb().prepare("DELETE FROM cache_entries WHERE key = ?").run(key);
}

export function clearCache() {
  getDb().prepare("DELETE FROM cache_entries").run();
}
