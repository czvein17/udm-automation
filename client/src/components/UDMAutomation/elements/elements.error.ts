import type { ZodError } from "zod";
import type { ElementRow } from "shared/dist/schema/elements.schema";

export type RowFieldErrors = Record<
  number,
  Partial<Record<keyof ElementRow, string>>
>;

export function zodErrorToRowFieldErrors(err: ZodError): RowFieldErrors {
  const out: RowFieldErrors = {};

  for (const issue of err.issues) {
    // for array schema, path looks like: [rowIndex, "fieldName"]
    const [rowIndex, field] = issue.path;

    if (typeof rowIndex !== "number") continue;
    if (typeof field !== "string") continue;

    (out[rowIndex] ??= {})[field as keyof ElementRow] = issue.message;
  }

  return out;
}
