import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveAutomationRoot() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "../../"); // automation/src/shared -> automation/
}

export function resolveStatePath(filename: string) {
  const root = resolveAutomationRoot();
  return path.join(root, "state", filename);
}
