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

    await (client as any).execute(`
      CREATE INDEX IF NOT EXISTS idx_task_logs_task_id
      ON task_logs(taskId);
    `);

    await (client as any).execute(`
      CREATE INDEX IF NOT EXISTS idx_automation_logs_run_seq
      ON automation_logs(runId, seq);
    `);

    await (client as any).execute(`
      CREATE INDEX IF NOT EXISTS idx_automation_logs_run_ts
      ON automation_logs(runId, ts);
    `);

    await (client as any).execute(`
      CREATE TABLE IF NOT EXISTS reporter_run_summaries (
        runId TEXT PRIMARY KEY,
        jobId TEXT NULL,
        runnerId TEXT NULL,
        firstTs TEXT NOT NULL,
        lastTs TEXT NOT NULL,
        totalEvents INTEGER NOT NULL DEFAULT 0,
        errorCount INTEGER NOT NULL DEFAULT 0,
        warnCount INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'running',
        latestMessage TEXT NOT NULL,
        lastSeq INTEGER NOT NULL DEFAULT 0
      );
    `);

    await (client as any).execute(`
      CREATE INDEX IF NOT EXISTS idx_reporter_run_summaries_last_seq
      ON reporter_run_summaries(lastSeq);
    `);

    await (client as any).execute(`
      CREATE INDEX IF NOT EXISTS idx_reporter_run_summaries_last_ts
      ON reporter_run_summaries(lastTs);
    `);
  } catch (e) {
    console.warn("Could not ensure tasks table exists:", e);
  }
})();
