import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { appendLog, finishRun } from "../stores/run.store";

export function runAutomationJob(args: { runId: string; jobId: string }) {
  // resolve repo root relative to this file (robust regardless of process.cwd)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, "../../../"); // server/src/runners -> repo root

  const { runId, jobId } = args;

  // run via shell so "bunx" (or npm scripts) can be resolved on Windows
  const child = spawn(`bunx tsx automation/src/cli.ts ${jobId} ${runId}`, {
    cwd: repoRoot,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    shell: true,
  });

  const pump = (buf: Buffer) => {
    const text = buf.toString("utf8");
    for (const line of text.split(/\r?\n/)) {
      if (line.trim()) appendLog(runId, line);
    }
  };

  child.stdout.on("data", pump);
  child.stderr.on("data", pump);

  child.on("close", (code) => {
    const ok = code === 0;
    finishRun(runId, {
      status: ok ? "SUCCESS" : "FAILED",
      finishedAt: new Date().toISOString(),
      exitCode: code ?? -1,
      error: ok ? undefined : `Exit code ${code ?? -1}`,
    });
  });

  child.on("error", (err: Error & { code?: string }) => {
    // helpful fallback: try npm script if bunx not available
    if (err.code === "ENOENT") {
      appendLog(runId, "bunx not found; attempting npm run cli fallback");
      const fallback = spawn(`npm run cli -- ${jobId}`, {
        cwd: repoRoot,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
        shell: true,
      });
      fallback.stdout.on("data", pump);
      fallback.stderr.on("data", pump);
      fallback.on("close", (code) => {
        const ok = code === 0;
        finishRun(runId, {
          status: ok ? "SUCCESS" : "FAILED",
          finishedAt: new Date().toISOString(),
          exitCode: code ?? -1,
          error: ok ? undefined : `Exit code ${code ?? -1}`,
        });
      });
      fallback.on("error", (e) =>
        finishRun(runId, {
          status: "FAILED",
          finishedAt: new Date().toISOString(),
          exitCode: -1,
          error: e.message,
        }),
      );
      return;
    }

    finishRun(runId, {
      status: "FAILED",
      finishedAt: new Date().toISOString(),
      exitCode: -1,
      error: err.message,
    });
  });
}
