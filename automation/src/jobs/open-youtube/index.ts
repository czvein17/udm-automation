import {
  runInfo,
  stepInfo,
  actionInfo,
  checkInfo,
  err,
} from "../../shared/logger";
import { launchBrowser } from "../../shared/browser";
import YT_SEL from "../../selectors/youtube-selector";

export async function runOpenYoutube() {
  runInfo("RUN_START: Open YouTube", { jobId: "open-youtube" });

  const Steps = {
    LAUNCH_BROWSER: "Launch Browser",
    NAVIGATE_YOUTUBE: "Navigate to YouTube",
    DONE: "Done",
  };

  stepInfo(Steps.LAUNCH_BROWSER, "Launching browser");

  const { browser, context, storageStatePath } = await launchBrowser();

  const page = await context.newPage();

  actionInfo(Steps.NAVIGATE_YOUTUBE, "Navigate", "Going to YouTube", {
    url: "https://youtube.com",
  });
  await page.goto("https://youtube.com", { waitUntil: "domcontentloaded" });

  stepInfo(Steps.DONE, "Job completed");

  await page.fill(YT_SEL.SEARCH_BAR, "CZ LANG MALAKAS");
  await page.press(YT_SEL.SEARCH_BAR, "Enter");
}
