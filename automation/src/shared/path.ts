import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

export function resolveAutomationRoot() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "../../"); // automation/src/shared -> automation/
}

export function resolveStatePath(filename: string) {
  if (path.isAbsolute(filename)) {
    return filename;
  }

  const configuredStateDir = (process.env.AUTOMATION_STATE_DIR ?? "").trim();
  const baseStateDir = configuredStateDir
    ? path.resolve(configuredStateDir)
    : path.join(resolveAutomationRoot(), "state");

  const resolvedPath = path.join(baseStateDir, filename);
  const resolvedDir = path.dirname(resolvedPath);
  fs.mkdirSync(resolvedDir, { recursive: true });

  return resolvedPath;
}
