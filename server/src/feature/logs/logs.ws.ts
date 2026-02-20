import type { WSContext } from "hono/ws";
import { getLogs } from "./logs.repo";
import type { LogEvent } from "./logs.schema";

type LogSocket = WSContext<unknown>;

const rooms = new Map<string, Set<LogSocket>>();

function roomForRun(runId: string) {
  return `logs:${runId}`;
}

export async function connectLogsRoom(runId: string, ws: LogSocket) {
  const roomId = roomForRun(runId);
  const sockets = rooms.get(roomId) ?? new Set<LogSocket>();
  sockets.add(ws);
  rooms.set(roomId, sockets);

  const initial = await getLogs(runId, undefined, 100);
  ws.send(JSON.stringify({ event: "logs:batch", data: initial.items }));
}

export function disconnectLogsRoom(runId: string, ws: LogSocket) {
  const roomId = roomForRun(runId);
  const sockets = rooms.get(roomId);
  if (!sockets) return;

  sockets.delete(ws);
  if (sockets.size === 0) rooms.delete(roomId);
}

export function broadcastLog(runId: string, event: LogEvent) {
  const roomId = roomForRun(runId);
  const sockets = rooms.get(roomId);
  if (!sockets || sockets.size === 0) return;

  const msg = JSON.stringify({ event: "logs:line", data: event });
  for (const ws of sockets) {
    ws.send(msg);
  }
}
