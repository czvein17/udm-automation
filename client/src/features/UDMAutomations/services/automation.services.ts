import { type ElementRow } from "../types/elements.types";
import { type ApiResponse } from "shared/";

export const submitElementListService = async (
  elements: ElementRow[],
): Promise<ApiResponse<{ runId: string } | null>> => {
  const response = await fetch("/api/v1/automation/open-multiple", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(elements),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Failed to submit elements");
    throw new Error(text || "Failed to submit elements");
  }

  const data = await response.json();
  console.log("API RESPONSE: ", data);
  return data as ApiResponse<{ runId: string } | null>;
};
