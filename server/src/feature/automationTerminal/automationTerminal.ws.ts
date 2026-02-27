import type {
  TerminalWsClientMessage,
  TerminalWsServerMessage,
} from "./automationTerminal.types";

type SocketLike = {
  send: (payload: string) => void;
};

const rooms = new Map<string, Set<SocketLike>>();
const socketRunId = new WeakMap<SocketLike, string>();

function send(socket: SocketLike, message: TerminalWsServerMessage) {
  socket.send(JSON.stringify(message));
}

function addToRoom(runId: string, socket: SocketLike) {
  const bucket = rooms.get(runId) ?? new Set<SocketLike>();
  bucket.add(socket);
  rooms.set(runId, bucket);
  socketRunId.set(socket, runId);
}

function removeFromRoom(socket: SocketLike) {
  const runId = socketRunId.get(socket);
  if (!runId) return;

  const bucket = rooms.get(runId);
  if (!bucket) return;

  bucket.delete(socket);
  socketRunId.delete(socket);

  if (bucket.size === 0) {
    rooms.delete(runId);
  }
}

async function handleSubscribe(runId: string, socket: SocketLike) {
  removeFromRoom(socket);
  addToRoom(runId, socket);

  send(socket, {
    kind: "subscribed",
    runId,
  });
}

export function onAutomationTerminalSocketOpen(_socket: SocketLike) {
  // subscription is explicit via client message
}

export function onAutomationTerminalSocketClose(socket: SocketLike) {
  removeFromRoom(socket);
}

export async function onAutomationTerminalSocketMessage(
  socket: SocketLike,
  rawMessage: string | Buffer | ArrayBuffer | SharedArrayBuffer | Blob,
) {
  let parsed: TerminalWsClientMessage | null = null;

  try {
    const text =
      rawMessage instanceof Blob
        ? await rawMessage.text()
        : rawMessage instanceof ArrayBuffer || rawMessage instanceof SharedArrayBuffer
          ? Buffer.from(rawMessage).toString("utf8")
          : Buffer.isBuffer(rawMessage)
            ? rawMessage.toString("utf8")
            : String(rawMessage);

    parsed = JSON.parse(text) as TerminalWsClientMessage;
  } catch {
    return;
  }

  if (!parsed || parsed.kind !== "subscribe") return;

  const runId = parsed.runId.trim();
  if (!runId) return;

  await handleSubscribe(runId, socket);
}

export function broadcastAutomationTerminalEvent(runId: string) {
  const bucket = rooms.get(runId);
  if (!bucket || bucket.size === 0) return;

  const message: TerminalWsServerMessage = {
    kind: "event",
    runId,
  };

  for (const socket of bucket) {
    send(socket, message);
  }
}

export function broadcastAutomationTerminalState(runId: string) {
  const bucket = rooms.get(runId);
  if (!bucket || bucket.size === 0) return;

  const message: TerminalWsServerMessage = {
    kind: "state",
    runId,
  };

  for (const socket of bucket) {
    send(socket, message);
  }
}
