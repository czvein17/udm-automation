import type { AutomationRunStatus } from "shared";

export type AutomationTerminalRun = {
  id: string;
  engine: string;
  status: AutomationRunStatus;
  createdAt: string;
  updatedAt: string;
};

export type AutomationTerminalTask = {
  id: string;
  runId: string;
  fieldName: string | null;
  elementId: string | null;
  tableName: string | null;
  elementName: string | null;
  displayName: string | null;
  url: string | null;
};

export type TerminalPage = {
  nextBeforeSeq?: number;
};

export type TerminalWsClientMessage = {
  kind: "subscribe";
  runId: string;
};

export type TerminalWsServerMessage =
  | {
      kind: "subscribed";
      runId: string;
    }
  | {
      kind: "event";
      runId: string;
    }
  | {
      kind: "state";
      runId: string;
    };
