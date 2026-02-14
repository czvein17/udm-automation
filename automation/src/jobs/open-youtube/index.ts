import {
  runInfo,
  stepInfo,
  actionInfo,
  checkInfo,
  err,
} from "../../shared/logger";
import { launchBrowser } from "../../shared/browser";
import YT_SEL from "../../selectors/youtube-selector";
import { getTaskByRunId } from "server/dist/feature/youtube/youtube.service";

export async function runOpenYoutube(runId: string) {
  console.log("Running Open YouTube job with runId:", runId);
  // runInfo("RUN_START: Open YouTube", { jobId: "open-youtube", runId });

  console.log("Getting task for runId:", runId);

  const task = await getTaskByRunId(runId);

  console.log(task);

  const Steps = {
    LAUNCH_BROWSER: "Launch Browser",
    NAVIGATE_YOUTUBE: "Navigate to YouTube",
    DONE: "Done",
  };

  // stepInfo(Steps.LAUNCH_BROWSER, "Launching browser");

  const { browser, context, storageStatePath } = await launchBrowser();

  const page = await context.newPage();

  // actionInfo(Steps.NAVIGATE_YOUTUBE, "Navigate", "Going to YouTube", {
  //   url: "https://youtube.com",
  // });

  await page.goto("https://youtube.com", {
    waitUntil: "domcontentloaded",
  });

  // stepInfo(Steps.DONE, "Job completed");

  await page.fill(YT_SEL.SEARCH_BAR, task?.fieldName || "");
  await page.press(YT_SEL.SEARCH_BAR, "Enter");
}
