import { ChevronRight } from "lucide-react";

import type { AutomationTerminalEvent } from "../../types/automationTerminal.types";
import { formatEventLine } from "../../utils/automationTerminal.utils";

type AutomationEventListProps = {
  events: AutomationTerminalEvent[];
};

export function AutomationEventList({ events }: AutomationEventListProps) {
  if (!events.length) {
    return <p className="terminal-empty-events">No events yet.</p>;
  }

  return (
    <ul className="terminal-event-list">
      {events.map((event) => (
        <li key={event.id} className="terminal-event-line">
          <ChevronRight className="w-3 h-3 terminal-event-chevron shrink-0" />
          <span className="terminal-event-seq shrink-0">#{event.seq}</span>
          <span
            className={`terminal-event-type terminal-event-type-${event.type} shrink-0`}
          >
            {event.type}
          </span>
          <span className="terminal-event-text">{formatEventLine(event)}</span>
        </li>
      ))}
    </ul>
  );
}
