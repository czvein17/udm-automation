import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { finishRun } from "../stores/run.store";
import { updateAutomationRunStatus } from "@server/feature/automationTerminal/automationTerminal.service";
import { broadcastAutomationTerminalState } from "@server/feature/automationTerminal/automationTerminal.ws";
import { serverLog } from "@server/util/runtimeLogger";

async function setTerminalRunStatus(runId: string, status: "SUCCESS" | "ERROR") {
  await updateAutomationRunStatus({ runId, status });
  broadcastAutomationTerminalState(runId);
}

export function runAutomationJob(args: { runId: string; jobId: string }) {
  // resolve repo root relative to this file (robust regardless of process.cwd)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, "../../../"); // server/src/runners -> repo root

  const { runId, jobId } = args;
  serverLog.info("automation.job.spawn", { runId, jobId });

  // run via shell so "bunx" (or npm scripts) can be resolved on Windows
  const child = spawn(`bunx tsx automation/src/cli.ts ${jobId} ${runId}`, {
    cwd: repoRoot,
    env: { ...process.env },
    stdio: ["ignore", "inherit", "inherit"],
    windowsHide: true,
    shell: true,
  });

  child.on("close", (code) => {
    const ok = code === 0;
    serverLog.info("automation.job.exit", { runId, jobId, exitCode: code ?? -1, ok });
    void setTerminalRunStatus(runId, ok ? "SUCCESS" : "ERROR");
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
      serverLog.warn("automation.job.fallback_to_npm", {
        runId,
        jobId,
        reason: "bunx_not_found",
      });

      const fallback = spawn(`npm run cli -- ${jobId}`, {
        cwd: repoRoot,
        env: { ...process.env },
        stdio: ["ignore", "inherit", "inherit"],
        windowsHide: true,
        shell: true,
      });

      fallback.on("close", (code) => {
        const ok = code === 0;
        serverLog.info("automation.job.fallback_exit", {
          runId,
          jobId,
          exitCode: code ?? -1,
          ok,
        });
        void setTerminalRunStatus(runId, ok ? "SUCCESS" : "ERROR");
        finishRun(runId, {
          status: ok ? "SUCCESS" : "FAILED",
          finishedAt: new Date().toISOString(),
          exitCode: code ?? -1,
          error: ok ? undefined : `Exit code ${code ?? -1}`,
        });
      });

      fallback.on("error", (e) => {
        serverLog.error("automation.job.fallback_error", {
          runId,
          jobId,
          error: e.message,
        });
        void setTerminalRunStatus(runId, "ERROR");
        finishRun(runId, {
          status: "FAILED",
          finishedAt: new Date().toISOString(),
          exitCode: -1,
          error: e.message,
        });
      });
      return;
    }

    serverLog.error("automation.job.spawn_error", {
      runId,
      jobId,
      error: err.message,
      code: err.code,
    });

    void setTerminalRunStatus(runId, "ERROR");
    finishRun(runId, {
      status: "FAILED",
      finishedAt: new Date().toISOString(),
      exitCode: -1,
      error: err.message,
    });
  });
}
