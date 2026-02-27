import { useMutation } from "@tanstack/react-query";

import type { AutomationTerminalEventsPage } from "../types/automationTerminal.types";
import { getAutomationTerminalEventsPageService } from "../services/automationTerminal.services";

export function useAutomationTerminalHistory(runId: string) {
  const loadOlderEventsMutation = useMutation({
    mutationFn: async (beforeSeq: number) => {
      if (!runId) {
        return {
          events: [],
          page: {},
        } as AutomationTerminalEventsPage;
      }

      return getAutomationTerminalEventsPageService({
        runId,
        beforeSeq,
        limit: 500,
      });
    },
  });

  return {
    isLoadingOlder: loadOlderEventsMutation.isPending,
    loadOlder: loadOlderEventsMutation.mutateAsync,
  };
}
