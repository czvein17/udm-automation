import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Play, Rows3, Target, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Request } from "../../features/UDMAutomations/pages/Request";
import { LogsSection } from "../../features/UDMAutomations/pages/LogsSection";
import {
  useAutomationSessionStore,
  useElementsDraftStore,
} from "../../features/UDMAutomations/store/automationUi.store";
import {
  selectElementsDraftSlice,
  selectSessionRunIdSlice,
  selectSessionTabSlice,
} from "../../features/UDMAutomations/store/automationUi.selectors";

export const Route = createFileRoute("/app/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-8">
      <div className="grid grid-cols-[2.2fr_1.5fr] grid-rows-[auto_1fr] gap-3 max-w-8xl mx-auto h-[calc(100vh-160px)]">
        <AutomationOverviewBar />
        <Request />
        <div className="card overflow-hidden min-h-0">
          <LogsSection />
        </div>
      </div>
    </div>
  );
}

function AutomationOverviewBar() {
  const { activeTab } = useAutomationSessionStore(useShallow(selectSessionTabSlice));
  const { currentRunId, setCurrentRunId } = useAutomationSessionStore(
    useShallow(selectSessionRunIdSlice),
  );
  const { elementRows, selectedRowIndexes } = useElementsDraftStore(
    useShallow(selectElementsDraftSlice),
  );

  const { populatedRowsCount, selectedRowsCount } = useMemo(() => {
    const nonEmptyRows = elementRows.filter((row) => {
      return (
        row.fieldName.trim() ||
        row.elementId.trim() ||
        row.tableName.trim() ||
        row.elementName?.trim() ||
        row.displayName?.trim()
      );
    });

    return {
      populatedRowsCount: nonEmptyRows.length,
      selectedRowsCount: selectedRowIndexes.length,
    };
  }, [elementRows, selectedRowIndexes.length]);

  return (
    <section className="automation-deck">
      <div className="min-w-0">
        <p className="automation-deck-kicker">
          Automation Control Deck
        </p>
        <h2 className="automation-deck-title">
          Keep requests, rows, and run visibility in sync
        </h2>
        <div className="mt-2 flex items-center flex-wrap gap-2 text-xs">
          <span className="automation-chip automation-chip-primary">
            <Target className="w-3 h-3" />
            Active tab: {activeTab}
          </span>
          <span className="automation-chip automation-chip-secondary">
            <Rows3 className="w-3 h-3" />
            Rows: {populatedRowsCount}
          </span>
          <span className="automation-chip automation-chip-secondary">
            <Play className="w-3 h-3" />
            Selected: {selectedRowsCount}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden md:block w-72">
          <label htmlFor="overview-run-id" className="automation-deck-label">
            Current run
          </label>
          <input
            id="overview-run-id"
            name="overviewRunId"
            value={currentRunId}
            onChange={(e) => setCurrentRunId(e.target.value)}
            placeholder="enter run id"
            className="form-input text-sm font-mono"
          />
        </div>

        <button
          type="button"
          onClick={() => setCurrentRunId("")}
          className="automation-clear-btn"
          disabled={!currentRunId.trim()}
          title="Clear current run id"
        >
          <X className="w-3 h-3" />
          Clear Run
        </button>
      </div>
    </section>
  );
}
