import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const envUrl = process.env.LIBSQL_URL;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.join(__dirname, "../../data/dev.db");
const fileUrl = `file:${defaultDbPath}`;

const client = createClient({
  url: envUrl ?? fileUrl,
});

export const db = drizzle(client);

// Ensure tasks table exists (useful for local file DBs)
void (async () => {
  try {
    await (client as any).execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        runId TEXT NOT NULL,
        fieldName TEXT NOT NULL
      );
    `);
  } catch (e) {
    console.warn("Could not ensure tasks table exists:", e);
  }
})();
