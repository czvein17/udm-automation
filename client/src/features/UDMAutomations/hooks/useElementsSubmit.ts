import { useCallback, useState } from "react";

import { elementRowsSchema } from "shared/dist/schema/elements.schema";

import type { ElementRow } from "@features/UDMAutomations/types/elements.types";
import {
  type RowFieldErrors,
  zodErrorToRowFieldErrors,
} from "@features/UDMAutomations/utils/elements.error";

const REQUIRED_FIELDS_ORDER: Array<keyof ElementRow> = [
  "fieldName",
  "elementId",
  "tableName",
  "displayName",
  "elementName",
];

type UseElementsSubmitParams = {
  data: ElementRow[];
  submitElementsList: (rows: ElementRow[]) => unknown;
};

function focusFirstInvalidInput(rowErrors: RowFieldErrors) {
  const rowIndexes = Object.keys(rowErrors)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  for (const rowIndex of rowIndexes) {
    const rowError = rowErrors[rowIndex];
    if (!rowError) continue;

    const targetField = REQUIRED_FIELDS_ORDER.find((field) =>
      Boolean(rowError[field]),
    );

    if (!targetField) continue;

    const targetInput = document.querySelector<HTMLInputElement>(
      `input[data-row="${rowIndex}"][data-col="${targetField}"]`,
    );

    if (!targetInput) continue;

    targetInput.scrollIntoView({ block: "center", behavior: "smooth" });
    targetInput.focus();
    return;
  }
}

export function useElementsSubmit({
  data,
  submitElementsList,
}: UseElementsSubmitParams) {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<RowFieldErrors>({});

  const onSubmit = useCallback(() => {
    setSubmitted(true);

    const parsed = elementRowsSchema.safeParse(data);

    if (!parsed.success) {
      const rowErrors = zodErrorToRowFieldErrors(parsed.error);
      setErrors(rowErrors);
      requestAnimationFrame(() => {
        focusFirstInvalidInput(rowErrors);
      });
      return;
    }

    setErrors({});
    submitElementsList(parsed.data);
  }, [data, submitElementsList]);

  return {
    submitted,
    errors,
    setErrors,
    onSubmit,
  };
}
