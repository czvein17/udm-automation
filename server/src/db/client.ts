import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const envUrl = process.env.LIBSQL_URL;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.join(__dirname, "../../dev.db");
const fileUrl = `file:${defaultDbPath}`;

const client = createClient({
  url: envUrl ?? fileUrl,
});

export const db = drizzle(client);

// Ensure tasks table exists (useful for local file DBs)
void (async () => {
  try {
    await (client as any).execute(`PRAGMA journal_mode = WAL;`);
    await (client as any).execute(`PRAGMA busy_timeout = 5000;`);

    await (client as any).execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        runId TEXT NOT NULL,
        fieldName TEXT NOT NULL
      );
    `);
    await (client as any).execute(`
      CREATE TABLE IF NOT EXISTS task_logs (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        logs TEXT NOT NULL,
        FOREIGN KEY (taskId) REFERENCES tasks(id)
      );
    `);
    await (client as any).execute(`
      CREATE TABLE IF NOT EXISTS automation_logs (
        id TEXT PRIMARY KEY,
        runId TEXT NOT NULL,
        jobId TEXT NULL,
        runnerId TEXT NULL,
        ts TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        metaJson TEXT NULL,
        raw TEXT NULL,
        seq INTEGER NOT NULL
      );
    `);
  } catch (e) {
    console.warn("Could not ensure tasks table exists:", e);
  }
})();
