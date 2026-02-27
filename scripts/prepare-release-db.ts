import fs from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";

const repoRoot = path.resolve(import.meta.dir, "..");
const sourceDbPath = path.join(repoRoot, "server", "dev.db");
const outputDir = path.join(repoRoot, "release", "windows", "app", "templates");
const outputDbPath = path.join(outputDir, "app-template.sqlite");

if (!fs.existsSync(sourceDbPath)) {
  throw new Error(`Source database not found: ${sourceDbPath}`);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.copyFileSync(sourceDbPath, outputDbPath);

const db = new Database(outputDbPath);

const defaults = {
  configFor: "udm",
  baseUrl: "https://axis.ehr.com/en-US/survey-setup/surveys",
  surveyline: "48",
  automationType: "udm:open_elem",
  translation: "English",
};

try {
  db.run("PRAGMA journal_mode = DELETE;");
  db.run("DELETE FROM tasks;");
  db.run("DELETE FROM automation_tasks;");
  db.run("DELETE FROM automation_runs;");
  db.run("DELETE FROM automation_events;");
  db.run("DELETE FROM config WHERE configFor != ?;", [defaults.configFor]);

  const existing = db
    .query("SELECT id FROM config WHERE configFor = ? LIMIT 1;")
    .get(defaults.configFor) as { id?: string } | null;

  if (existing?.id) {
    db.run(
      "UPDATE config SET baseUrl = ?, surveyline = ?, automationType = ?, translation = ? WHERE id = ?;",
      [
        defaults.baseUrl,
        defaults.surveyline,
        defaults.automationType,
        defaults.translation,
        existing.id,
      ],
    );
  } else {
    db.run(
      "INSERT INTO config (id, configFor, baseUrl, surveyline, automationType, translation) VALUES (?, ?, ?, ?, ?, ?);",
      [
        crypto.randomUUID(),
        defaults.configFor,
        defaults.baseUrl,
        defaults.surveyline,
        defaults.automationType,
        defaults.translation,
      ],
    );
  }

  db.run("VACUUM;");
} finally {
  db.close();
}

console.log(`Prepared release SQLite template: ${outputDbPath}`);
