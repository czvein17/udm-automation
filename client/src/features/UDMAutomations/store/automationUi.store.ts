import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { SetStateAction } from "react";

import { initialRows } from "../constants/elements.data";
import type { ElementRow } from "../types/elements.types";

export type AutomationTab = "Elements" | "Automation Config" | "Auth";

export type AutomationSessionState = {
  activeTab: AutomationTab;
  currentRunId: string;
  setActiveTab: (tab: AutomationTab) => void;
  setCurrentRunId: (runId: string) => void;
};

export type ElementsDraftState = {
  elementRows: ElementRow[];
  selectedRowIndexes: number[];
  setElementRows: (updater: SetStateAction<ElementRow[]>) => void;
  setSelectedRowIndexes: (updater: SetStateAction<number[]>) => void;
};

export const useAutomationSessionStore = create<AutomationSessionState>()(
  persist(
    (set) => ({
      activeTab: "Elements",
      currentRunId: "",
      setActiveTab: (tab) => set({ activeTab: tab }),
      setCurrentRunId: (runId) => set({ currentRunId: runId }),
    }),
    {
      name: "udm-automation-session",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useElementsDraftStore = create<ElementsDraftState>()(
  persist(
    (set) => ({
      elementRows: initialRows,
      selectedRowIndexes: [],
      setElementRows: (updater) =>
        set((state) => ({
          elementRows:
            typeof updater === "function"
              ? updater(state.elementRows)
              : updater,
        })),
      setSelectedRowIndexes: (updater) =>
        set((state) => ({
          selectedRowIndexes:
            typeof updater === "function"
              ? updater(state.selectedRowIndexes)
              : updater,
        })),
    }),
    {
      name: "udm-elements-draft",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
