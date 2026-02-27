import type { Page } from "playwright-core";

import type { Task } from "@shared/schema/task.schema";

import type { createAutomationReporter } from "../../reporter/automationReporter";
import udmSelector from "../../selectors/udm-selector";
import {
  identifySurveyCycleType,
  type SurveyCycleType,
} from "../../util/buildUrl";
import { automationLog } from "../../util/runtimeLogger";
import { waitForSpinnerToSettle } from "./waitForUiReady";

type AutomationReporter = ReturnType<typeof createAutomationReporter>;

const SEARCH_TIMEOUT = 5000;
const GRID_SELECTOR_POLL_INTERVAL_MS = 150;

type GridSearchResult = {
  cycleType: SurveyCycleType;
  searchTerm: string;
  gridSelector: string;
};

function getSearchTerm(task: Task): string {
  const candidates = [task.fieldName, task.elementName, task.displayName];

  for (const value of candidates) {
    const normalized = String(value ?? "").trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return "";
}

function getGridSelectorCandidates(cycleType: SurveyCycleType): string[] {
  if (cycleType === "INC") {
    return [
      udmSelector.elementsGridIncumbent,
      udmSelector.elementsGrid,
      udmSelector.elementsGridFallback,
    ];
  }

  return [udmSelector.elementsGrid, udmSelector.elementsGridFallback];
}

async function resolveGridSelector(
  page: Page,
  selectorCandidates: string[],
  timeout: number,
): Promise<string> {
  const deadline = Date.now() + timeout;

  while (Date.now() <= deadline) {
    for (const selector of selectorCandidates) {
      const isVisible = await page
        .locator(selector)
        .first()
        .isVisible()
        .catch(() => false);

      if (isVisible) {
        return selector;
      }
    }

    await page.waitForTimeout(GRID_SELECTOR_POLL_INTERVAL_MS);
  }

  throw new Error("Elements grid not found");
}

export async function searchElementInGrid(args: {
  page: Page;
  task: Task;
  url: string;
  reporter?: AutomationReporter;
}): Promise<GridSearchResult> {
  const { page, task, url, reporter } = args;

  const cycleType = identifySurveyCycleType(url);
  const searchTerm = getSearchTerm(task);

  if (cycleType === "UNKNOWN") {
    throw new Error("Unable to identify cycle type from URL");
  }

  if (!searchTerm) {
    throw new Error("Task does not include a searchable field value");
  }

  const gridSelector = await resolveGridSelector(
    page,
    getGridSelectorCandidates(cycleType),
    SEARCH_TIMEOUT,
  );

  const grid = page.locator(gridSelector).first();
  const filterInput = grid.locator(udmSelector.elementsGridFilterInput).first();

  await waitForSpinnerToSettle(page, 1000);
  await filterInput.fill("");
  await filterInput.fill(searchTerm);

  await reporter?.emit({
    type: "fill",
    details: "Elements grid filter applied",
    payload: {
      cycleType,
      searchTerm,
      gridSelector,
    },
  });

  automationLog.info("task.elements_grid_search_applied", {
    taskId: task.id,
    tableName: task.tableName,
    cycleType,
    searchTerm,
    gridSelector,
  });

  return {
    cycleType,
    searchTerm,
    gridSelector,
  };
}
