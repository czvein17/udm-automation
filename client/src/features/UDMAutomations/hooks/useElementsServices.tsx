import { useMutation } from "@tanstack/react-query";
import type { ElementRow } from "../types/elements.types";
import { submitElementListService } from "../services/automation.services";

type UseElementServicesOptions = {
  onSubmitted?: (runId: string) => void;
};

export const useElementServices = (options?: UseElementServicesOptions) => {
  const submitElementsList = useMutation({
    mutationFn: async (elements: ElementRow[]) =>
      submitElementListService(elements),

    onSuccess: (data) => {
      console.log(data);
      const runId = data?.data?.runId;
      if (runId) options?.onSubmitted?.(runId);
    },

    onError: (error) => {
      console.error("Error submitting elements list:", error);
    },
  });

  return {
    mutateFn: submitElementsList.mutate,
    isLoading: submitElementsList.isPending,
    isError: submitElementsList.isError,
    error: submitElementsList.error,
  };
};
