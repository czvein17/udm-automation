import type { Page } from "playwright-core";

import { automationLog } from "../../util/runtimeLogger";
import { waitForSpinnerToSettle } from "./waitForUiReady";

const DEFAULT_TIMEOUT = 30000;

export async function clickButtonWithRetry(args: {
  page: Page;
  selector: string;
  actionName: string;
  timeout?: number;
  attempts?: number;
}) {
  const {
    page,
    selector,
    actionName,
    timeout = DEFAULT_TIMEOUT,
    attempts = 3,
  } = args;

  const button = page.locator(selector).first();

  if ((await button.count()) === 0) {
    automationLog.info("ui.button.missing", { actionName, selector });
    return false;
  }

  await waitForSpinnerToSettle(page, timeout);

  let lastErr: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await button.waitFor({
        state: "visible",
        timeout: Math.min(5000, timeout),
      });

      if (!(await button.isEnabled())) {
        automationLog.info("ui.button.disabled", { actionName, selector });
        return false;
      }

      await button.click({ timeout: Math.min(10000, timeout) });
      return true;
    } catch (err) {
      lastErr = err;
      await waitForSpinnerToSettle(page, 3000);
    }
  }

  const errMsg =
    lastErr instanceof Error ? lastErr.message : String(lastErr ?? "unknown");
  automationLog.warn("ui.button.click_failed", {
    actionName,
    selector,
    error: errMsg,
  });

  return false;
}

export async function waitForButtonEnabled(
  page: Page,
  selector: string,
  timeout = DEFAULT_TIMEOUT,
) {
  await page.waitForFunction(
    (targetSelector) => {
      const element = document.querySelector(targetSelector);
      if (!(element instanceof HTMLButtonElement)) return false;
      return !element.disabled && !element.hasAttribute("disabled");
    },
    selector,
    { timeout },
  );
}
