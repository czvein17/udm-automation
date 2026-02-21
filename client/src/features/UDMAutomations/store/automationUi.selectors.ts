import type {
  AutomationSessionState,
  ElementsDraftState,
} from "./automationUi.store";

export const selectSessionTabSlice = (state: AutomationSessionState) => ({
  activeTab: state.activeTab,
  setActiveTab: state.setActiveTab,
});

export const selectSessionRunIdSlice = (state: AutomationSessionState) => ({
  currentRunId: state.currentRunId,
  setCurrentRunId: state.setCurrentRunId,
});

export const selectSetCurrentRunId = (state: AutomationSessionState) =>
  state.setCurrentRunId;

export const selectElementsDraftSlice = (state: ElementsDraftState) => ({
  elementRows: state.elementRows,
  setElementRows: state.setElementRows,
  selectedRowIndexes: state.selectedRowIndexes,
  setSelectedRowIndexes: state.setSelectedRowIndexes,
});
