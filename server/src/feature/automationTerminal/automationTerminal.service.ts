import type {
  AutomationRunStatus,
  CreateAutomationEventBody,
} from "shared";
import {
  toNextBeforeSeq,
  parseBeforeSeq,
  parseLimit,
} from "./automationTerminal.mapper";
import * as automationTerminalRepo from "./automationTerminal.repo";

export async function createAutomationEvent(args: {
  runId: string;
  body: CreateAutomationEventBody;
}) {
  const run = await automationTerminalRepo.getRunById(args.runId);
  if (!run) return null;

  await automationTerminalRepo.upsertTaskFromEvent({
    runId: args.runId,
    taskId: args.body.taskId,
    payload: args.body.payload,
  });

  const maxSeq = await automationTerminalRepo.getMaxSeqForRun(args.runId);
  const seq = maxSeq + 1;

  return await automationTerminalRepo.insertEvent({
    runId: args.runId,
    seq,
    body: args.body,
  });
}

export async function getAutomationTerminalSnapshot(args: {
  runId: string;
  limitParam?: string;
  beforeSeqParam?: string;
}) {
  const limit = parseLimit(args.limitParam);
  const beforeSeq = parseBeforeSeq(args.beforeSeqParam);

  const run = await automationTerminalRepo.getRunById(args.runId);
  if (!run) return null;

  const [tasks, events] = await Promise.all([
    automationTerminalRepo.getTasksByRunId(args.runId),
    automationTerminalRepo.getEventsForTerminal({
      runId: args.runId,
      limit,
      beforeSeq,
    }),
  ]);

  const nextBeforeSeqCandidate = toNextBeforeSeq(events);
  const hasOlder = nextBeforeSeqCandidate
    ? await automationTerminalRepo.hasOlderEvents(args.runId, nextBeforeSeqCandidate)
    : false;

  return {
    runId: args.runId,
    run,
    tasks,
    events,
    page: {
      nextBeforeSeq: hasOlder ? nextBeforeSeqCandidate : undefined,
    },
  };
}

export async function getAutomationTerminalEventsPage(args: {
  runId: string;
  limitParam?: string;
  beforeSeqParam?: string;
}) {
  const run = await automationTerminalRepo.getRunById(args.runId);
  if (!run) return null;

  const limit = parseLimit(args.limitParam);
  const beforeSeq = parseBeforeSeq(args.beforeSeqParam);

  const events = await automationTerminalRepo.getEventsForTerminal({
    runId: args.runId,
    limit,
    beforeSeq,
  });

  const nextBeforeSeqCandidate = toNextBeforeSeq(events);
  const hasOlder = nextBeforeSeqCandidate
    ? await automationTerminalRepo.hasOlderEvents(args.runId, nextBeforeSeqCandidate)
    : false;

  return {
    events,
    page: {
      nextBeforeSeq: hasOlder ? nextBeforeSeqCandidate : undefined,
    },
  };
}

export async function updateAutomationRunStatus(args: {
  runId: string;
  status: AutomationRunStatus;
}) {
  const run = await automationTerminalRepo.getRunById(args.runId);
  if (!run) return null;

  return await automationTerminalRepo.updateRunStatus(args.runId, args.status);
}
