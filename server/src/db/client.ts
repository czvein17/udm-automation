import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serverLog } from "@server/util/runtimeLogger";

const envUrl = process.env.LIBSQL_URL;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.join(__dirname, "../../dev.db");
const fileUrl = `file:${defaultDbPath}`;

const client = createClient({
  url: envUrl ?? fileUrl,
});

export const db = drizzle(client);

// Keep runtime bootstrap minimal; schema is managed by drizzle migrations.
void (async () => {
  try {
    await (client as any).execute(`PRAGMA journal_mode = WAL;`);
    await (client as any).execute(`PRAGMA busy_timeout = 5000;`);
  } catch (e) {
    serverLog.warn("db.runtime_pragma_failed", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
})();
