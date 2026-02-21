import { useEffect, useMemo, useRef, useState } from "react";
import { useLogsStream } from "../hooks/useLogsStream";
import {
  buildLogsDisplayModel,
  type LogsDisplayModel,
} from "../utils/LogsTerminal.mapper";
import {
  LogsGroupCard,
  LogsIssuesBanner,
  LogsRunHeader,
  LogsTopBar,
} from "./logs-terminal";

type LogsTerminalProps = {
  runId: string;
};

const AUTO_SCROLL_THRESHOLD_PX = 40;
const LOAD_OLDER_THRESHOLD_PX = 80;

function isNearBottom(el: HTMLDivElement) {
  return (
    el.scrollHeight - el.scrollTop - el.clientHeight <= AUTO_SCROLL_THRESHOLD_PX
  );
}

export function LogsTerminal({ runId }: LogsTerminalProps) {
  const {
    items,
    totalCount,
    autoScroll,
    setAutoScroll,
    status,
    hasMore,
    isLoadingOlder,
    loadOlder,
  } = useLogsStream(runId, 200);

  const listRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const nearBottomRef = useRef(true);

  const [displayModel, setDisplayModel] = useState<LogsDisplayModel>(() =>
    buildLogsDisplayModel([], runId),
  );

  useEffect(() => {
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = window.requestAnimationFrame(() => {
      setDisplayModel(buildLogsDisplayModel(items, runId));
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [items, runId]);

  const renderedGroups = useMemo(
    () => displayModel.groups,
    [displayModel.groups],
  );

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;

    if (el.scrollTop <= LOAD_OLDER_THRESHOLD_PX && hasMore && !isLoadingOlder) {
      void loadOlder();
    }

    const nearBottom = isNearBottom(el);
    nearBottomRef.current = nearBottom;
    setAutoScroll((prev) => (prev === nearBottom ? prev : nearBottom));
  };

  useEffect(() => {
    if (!autoScroll) return;

    const el = listRef.current;

    if (!el) return;

    if (!nearBottomRef.current) return;

    el.scrollTop = el.scrollHeight;
  }, [autoScroll, items.length, renderedGroups.length]);

  return (
    <div className="logs-terminal-shell">
      <LogsTopBar
        runId={runId}
        totalCount={totalCount}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        status={status}
      />

      {status === "disconnected" ? (
        <div className="px-3 py-2 text-xs border-b logs-status-disconnected">
          Live stream disconnected. Reconnect attempts exhausted.
        </div>
      ) : null}

      <LogsRunHeader header={displayModel.header} runId={runId} />

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="logs-scrollbar flex-1 min-h-0 overflow-auto font-mono text-xs leading-5 px-3 py-2 space-y-1"
      >
        <LogsIssuesBanner issues={displayModel.globalIssues} />

        {displayModel.groups.length > 0 ? (
          <div className="mb-3 space-y-2">
            {renderedGroups.map((group) => (
              <LogsGroupCard key={group.key} group={group} />
            ))}
          </div>
        ) : (
          <div className="logs-terminal-empty">
            No grouped rows yet. Run automation to populate logs.
          </div>
        )}
      </div>
    </div>
  );
}
