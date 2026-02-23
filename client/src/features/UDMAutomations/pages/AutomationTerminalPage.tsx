import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildTaskCards,
  type AutomationTaskCardModel,
} from "../types/automationTerminal.types";
import { isNearBottom } from "../utils/automationTerminal.utils";
import { useAutomationTerminalHistory } from "../hooks/useAutomationTerminalHistory";
import { useAutomationTerminalStream } from "../hooks/useAutomationTerminalStream";
import { AutomationTerminalTopBar } from "../components/logs/AutomationTerminalTopBar";
import { AutomationTaskCard } from "../components/logs/AutomationTaskCard";

type AutomationTerminalPageProps = {
  runId: string;
};

export function AutomationTerminalPage({ runId }: AutomationTerminalPageProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [historyMode, setHistoryMode] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(
    new Set(),
  );

  const {
    status,
    run,
    tasks,
    events,
    counts,
    nextBeforeSeq,
    prependOlderEvents,
  } = useAutomationTerminalStream(runId);

  const { isLoadingOlder, loadOlder } = useAutomationTerminalHistory(runId);

  const cards = useMemo<AutomationTaskCardModel[]>(() => {
    return buildTaskCards({
      tasks,
      events,
      maxCards: historyMode ? 1000 : 200,
      defaultEventLimitPerTask: historyMode ? 200 : 25,
      expandedTaskIds,
    });
  }, [tasks, events, historyMode, expandedTaskIds]);

  useEffect(() => {
    if (!autoScroll) return;
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [autoScroll, cards.length, events.length]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    setAutoScroll(isNearBottom(container));

    if (container.scrollTop <= 32 && nextBeforeSeq && !isLoadingOlder) {
      void loadOlderEvents();
    }
  };

  const loadOlderEvents = async () => {
    if (!nextBeforeSeq || isLoadingOlder) return;
    const container = scrollRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;

    const page = await loadOlder(nextBeforeSeq);
    prependOlderEvents(page.events, page.page.nextBeforeSeq);

    window.requestAnimationFrame(() => {
      if (!container) return;
      const nextScrollHeight = container.scrollHeight;
      const delta = nextScrollHeight - previousScrollHeight;
      container.scrollTop = previousScrollTop + delta;
    });
  };

  const onToggleExpandTask = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  if (!runId) {
    return (
      <div className="automation-empty">
        Select or start a run to open the Automation Terminal.
      </div>
    );
  }

  return (
    <section className="automation-terminal-shell">
      <AutomationTerminalTopBar
        runId={runId}
        connectionStatus={status}
        runStatus={run?.status ?? "RUNNING"}
        taskCount={counts.tasks}
        eventCount={counts.events}
      />

      <div className="terminal-actions-row">
        <button
          type="button"
          className="terminal-history-toggle"
          onClick={() => setHistoryMode((prev) => !prev)}
        >
          {historyMode ? "History mode: ON" : "History mode: OFF"}
        </button>
        <button
          type="button"
          className="terminal-load-older"
          onClick={() => void loadOlderEvents()}
          disabled={!nextBeforeSeq || isLoadingOlder}
        >
          {isLoadingOlder
            ? "Loading..."
            : nextBeforeSeq
              ? "Load older"
              : "No older events"}
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="automation-terminal-scroll"
      >
        {cards.length === 0 ? (
          <div className="automation-empty">
            No terminal events yet for this run.
          </div>
        ) : (
          <div className="terminal-card-list">
            {cards.map((card) => (
              <AutomationTaskCard
                key={card.task.id}
                card={card}
                expanded={expandedTaskIds.has(card.task.id)}
                onToggleExpand={onToggleExpandTask}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
