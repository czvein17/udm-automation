import { AutomationEventList } from "./AutomationEventList";
import { AutomationTaskHeader } from "./AutomationTaskHeader";
import type { AutomationTaskCardModel } from "../../types/automationTerminal.types";

type AutomationTaskCardProps = {
  card: AutomationTaskCardModel;
  onToggleExpand: (taskId: string) => void;
  expanded: boolean;
};

function getTaskSummaryStatus(events: AutomationTaskCardModel["events"]) {
  const lastEvent = events[events.length - 1];
  if (!lastEvent) return "RUNNING" as const;
  if (lastEvent.type === "success") return "OK" as const;
  if (lastEvent.type === "error") return "FAIL" as const;
  return "RUNNING" as const;
}

export function AutomationTaskCard({
  card,
  onToggleExpand,
  expanded,
}: AutomationTaskCardProps) {
  const status = getTaskSummaryStatus(card.events);

  return (
    <article
      className={`terminal-task-card ${card.hasOverflow ? "terminal-task-card-with-toggle" : ""}`}
    >
      <div className="terminal-task-meta-top">
        <span className="terminal-task-row-label">Row #{card.rowNumber ?? "-"}</span>
        <span
          className={`terminal-task-status-chip terminal-task-status-chip-${status.toLowerCase()}`}
        >
          {status}
        </span>
      </div>
      <AutomationTaskHeader task={card.task} />
      <AutomationEventList events={card.events} />
      {card.hasOverflow ? (
        <button
          type="button"
          className="terminal-show-more terminal-show-more-corner"
          onClick={() => onToggleExpand(card.task.id)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </article>
  );
}
