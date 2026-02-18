import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";

export type ElementStatus = "approved" | "draft" | "pending" | "unknown";

/**
 * Detect status by checking the element inside the properties container.
 * Returns one of `approved|pending|draft|unknown`.
 */
export async function detectStatus(tab: Page): Promise<ElementStatus> {
  const locator = tab
    .locator(`${udmSelector.ElementsContainer} ${udmSelector.STATUS_SELECTOR}`)
    .first();

  try {
    const [classAttr, text] = await Promise.all([
      locator.getAttribute("class"),
      locator.textContent(),
    ]);
    const combined = ((classAttr || "") + " " + (text || "")).toLowerCase();

    if (
      combined.includes(udmSelector.STATUS_APPROVED_CLASS) ||
      combined.includes("approved")
    )
      return "approved";
    if (
      combined.includes(udmSelector.STATUS_PENDING_CLASS) ||
      combined.includes("pending")
    )
      return "pending";
    if (
      combined.includes(udmSelector.STATUS_DRAFT_CLASS) ||
      combined.includes("draft")
    )
      return "draft";

    const txt = (text || "").trim().toLowerCase();
    return (txt as ElementStatus) || "unknown";
  } catch {
    return "unknown";
  }
}

export async function getElementStatus(page: Page) {
  return detectStatus(page);
}

export default detectStatus;
