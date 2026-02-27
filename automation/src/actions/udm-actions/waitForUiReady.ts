import type { Page } from "playwright-core";

import udmSelector from "../../selectors/udm-selector";

const DEFAULT_TIMEOUT = 30000;
const FALLBACK_SPINNER_SELECTOR = ".ngx-spinner-overlay";

export async function waitForSpinnerToSettle(
  page: Page,
  timeout = DEFAULT_TIMEOUT,
) {
  const spinnerSelector = udmSelector.spinner || FALLBACK_SPINNER_SELECTOR;

  await page
    .waitForSelector(spinnerSelector, {
      state: "detached",
      timeout,
    })
    .catch(() => {});
}

export async function waitForElementPropertiesReady(
  page: Page,
  timeout = DEFAULT_TIMEOUT,
) {
  await page
    .locator(udmSelector.ElementsContainer)
    .first()
    .waitFor({
      state: "visible",
      timeout,
    })
    .catch(() => {});

  await waitForSpinnerToSettle(page, timeout);
}

export async function waitForElementsContainerReady(
  page: Page,
  timeout = DEFAULT_TIMEOUT,
) {
  await page
    .locator(udmSelector.elementsContainer)
    .first()
    .waitFor({
      state: "visible",
      timeout,
    })
    .catch(() => {});

  await waitForSpinnerToSettle(page, timeout);
}
