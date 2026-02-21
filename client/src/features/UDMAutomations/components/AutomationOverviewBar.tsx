import { useMemo } from "react";
import { Play, Rows3, Target, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  useAutomationSessionStore,
  useElementsDraftStore,
} from "../store/automationUi.store";
import {
  selectElementsDraftSlice,
  selectSessionRunIdSlice,
  selectSessionTabSlice,
} from "../store/automationUi.selectors";
import { StatusChip } from "./StatusChip";

export function AutomationOverviewBar() {
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

  const chips = [
    {
      key: "active-tab",
      variant: "primary" as const,
      icon: <Target className="w-3 h-3" />,
      label: `Active tab: ${activeTab}`,
    },
    {
      key: "rows",
      variant: "secondary" as const,
      icon: <Rows3 className="w-3 h-3" />,
      label: `Rows: ${populatedRowsCount}`,
    },
    {
      key: "selected",
      variant: "secondary" as const,
      icon: <Play className="w-3 h-3" />,
      label: `Selected: ${selectedRowsCount}`,
    },
  ];

  return (
    <section className="automation-deck">
      <div className="min-w-0">
        <p className="automation-deck-kicker">Automation Control Deck</p>
        <h2 className="automation-deck-title">
          Keep requests, rows, and run visibility in sync
        </h2>
        <div className="mt-2 flex items-center flex-wrap gap-2 text-xs">
          {chips.map((chip) => (
            <StatusChip
              key={chip.key}
              icon={chip.icon}
              label={chip.label}
              variant={chip.variant}
            />
          ))}
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
