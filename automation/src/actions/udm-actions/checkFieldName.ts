import type { Page } from "playwright-core";
import udmSelector from "../../selectors/udm-selector";

/**
 * Read the field-name value from the page using the known selector.
 * Returns the found value (trimmed). Does not throw on missing selector.
 */
export async function readFieldNameFromPage(page: Page): Promise<string> {
  const sel = udmSelector.attrFieldNameInput;
  try {
    await page.waitForSelector(sel, { timeout: 2000 });
    const el = await page.$(sel);
    if (!el) return "";

    try {
      const v = await el.inputValue();
      return (v ?? "").toString().trim();
    } catch (e) {
      const t = await el.textContent();
      return (t ?? "").toString().trim();
    }
  } catch (e) {
    // selector not found
    return "";
  }
}

/**
 * Compare expected fieldName to the page value.
 * Returns { match, found } where match is boolean and found is the page value.
 */
export async function checkFieldName(
  page: Page,
  expected?: string | null,
): Promise<{ match: boolean; found: string }> {
  const found = await readFieldNameFromPage(page);
  const exp = (expected ?? "").toString().trim();
  return { match: found === exp, found };
}
