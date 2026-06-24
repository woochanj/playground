import "dotenv/config";
import { WebSocketServer, WebSocket } from "ws";
import { parse as parseCookie } from "cookie";
import { decode } from "@auth/core/jwt";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  users,
  chatMessages,
  sheetCells,
} from "../src/db/schema";
import type {
  ClientMessage,
  ServerMessage,
  WsUser,
  LockPayload,
} from "../src/lib/realtime-types";

const PORT = Number(process.env.WS_PORT || 3101);
const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) throw new Error("AUTH_SECRET is not set");

// NextAuth v5(비-HTTPS) 세션 쿠키명 = salt
const COOKIE_NAME = "authjs.session-token";

type Client = {
  ws: WebSocket;
  user: WsUser;
  sheetId: number | null; // 현재 구독 중인 시트
};

const clients = new Set<Client>();

// 시트별 셀 잠금: sheetId -> "row:col" -> { userId, userName }
const locks = new Map<number, Map<string, { userId: number; userName: string }>>();

function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

/** 전체 클라이언트에 브로드캐스트(필터 옵션). */
function broadcast(msg: ServerMessage, filter?: (c: Client) => boolean) {
  const data = JSON.stringify(msg);
  for (const c of clients) {
    if (filter && !filter(c)) continue;
    if (c.ws.readyState === WebSocket.OPEN) c.ws.send(data);
  }
}

/** 쿠키에서 세션을 디코드해 사용자 확인. */
async function authenticate(cookieHeader: string | undefined): Promise<WsUser | null> {
  if (!cookieHeader) return null;
  const cookies = parseCookie(cookieHeader);
  // 청크 쿠키(authjs.session-token.0 ...) 합치기
  let token = cookies[COOKIE_NAME];
  if (!token) {
    const chunks = Object.keys(cookies)
      .filter((k) => k.startsWith(`${COOKIE_NAME}.`))
      .sort()
      .map((k) => cookies[k]);
    if (chunks.length) token = chunks.join("");
  }
  if (!token) return null;

  try {
    const payload = await decode({
      token,
      secret: AUTH_SECRET!,
      salt: COOKIE_NAME,
    });
    if (!payload?.id) return null;
    const [u] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, Number(payload.id)))
      .limit(1);
    return u ?? null;
  } catch {
    return null;
  }
}

// ── 시트 구독 시 스냅샷 전송 ──
async function sendSheetSnapshot(client: Client, sheetId: number) {
  const cells = await db
    .select({ row: sheetCells.row, col: sheetCells.col, value: sheetCells.value })
    .from(sheetCells)
    .where(eq(sheetCells.sheetId, sheetId))
    .orderBy(asc(sheetCells.row), asc(sheetCells.col));

  const sheetLocks = locks.get(sheetId);
  const lockList: LockPayload[] = sheetLocks
    ? [...sheetLocks.entries()].map(([key, v]) => {
        const [row, col] = key.split(":").map(Number);
        return { row, col, userId: v.userId, userName: v.userName };
      })
    : [];

  send(client.ws, {
    type: "sheet:snapshot",
    sheetId,
    cells,
    locks: lockList,
  });
}

// ── 클라이언트 연결 종료 시 잠금 해제 ──
function releaseLocksOf(client: Client) {
  if (client.sheetId == null) return;
  const sheetLocks = locks.get(client.sheetId);
  if (!sheetLocks) return;
  for (const [key, v] of [...sheetLocks.entries()]) {
    if (v.userId === client.user.id) {
      sheetLocks.delete(key);
      const [row, col] = key.split(":").map(Number);
      broadcast(
        { type: "sheet:unlocked", sheetId: client.sheetId!, row, col },
        (c) => c.sheetId === client.sheetId,
      );
    }
  }
}

async function handleMessage(client: Client, raw: ClientMessage) {
  switch (raw.type) {
    case "chat:send": {
      const content = raw.content?.trim();
      if (!content) return;
      const [created] = await db
        .insert(chatMessages)
        .values({ authorId: client.user.id, content: content.slice(0, 2000) })
        .returning({ id: chatMessages.id, createdAt: chatMessages.createdAt });

      broadcast({
        type: "chat:new",
        message: {
          id: created.id,
          authorId: client.user.id,
          authorName: client.user.name,
          content: content.slice(0, 2000),
          createdAt: created.createdAt.toISOString(),
        },
      });
      break;
    }

    case "sheet:join": {
      client.sheetId = raw.sheetId;
      await sendSheetSnapshot(client, raw.sheetId);
      break;
    }

    case "sheet:lock": {
      const { sheetId, row, col } = raw;
      let sheetLocks = locks.get(sheetId);
      if (!sheetLocks) {
        sheetLocks = new Map();
        locks.set(sheetId, sheetLocks);
      }
      const key = cellKey(row, col);
      const existing = sheetLocks.get(key);
      if (existing && existing.userId !== client.user.id) {
        // 이미 다른 사람이 점유 중
        send(client.ws, {
          type: "sheet:lock-denied",
          sheetId,
          row,
          col,
          byName: existing.userName,
        });
        return;
      }
      sheetLocks.set(key, { userId: client.user.id, userName: client.user.name });
      broadcast(
        {
          type: "sheet:locked",
          sheetId,
          lock: { row, col, userId: client.user.id, userName: client.user.name },
        },
        (c) => c.sheetId === sheetId,
      );
      break;
    }

    case "sheet:unlock": {
      const { sheetId, row, col } = raw;
      const sheetLocks = locks.get(sheetId);
      const key = cellKey(row, col);
      const existing = sheetLocks?.get(key);
      if (existing && existing.userId === client.user.id) {
        sheetLocks!.delete(key);
        broadcast({ type: "sheet:unlocked", sheetId, row, col }, (c) => c.sheetId === sheetId);
      }
      break;
    }

    case "sheet:set": {
      const { sheetId, row, col, value } = raw;
      const sheetLocks = locks.get(sheetId);
      const existing = sheetLocks?.get(cellKey(row, col));
      // 잠금 보유자만 저장 가능(없으면 자유 편집 허용 안 함)
      if (existing && existing.userId !== client.user.id) return;

      const v = value.slice(0, 2000);
      // upsert
      await db
        .insert(sheetCells)
        .values({ sheetId, row, col, value: v, updatedBy: client.user.id, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [sheetCells.sheetId, sheetCells.row, sheetCells.col],
          set: { value: v, updatedBy: client.user.id, updatedAt: new Date() },
        });

      broadcast(
        { type: "sheet:cell", sheetId, row, col, value: v, userId: client.user.id },
        (c) => c.sheetId === sheetId,
      );
      break;
    }
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", async (ws, req) => {
  const user = await authenticate(req.headers.cookie);
  if (!user) {
    send(ws, { type: "error", message: "인증이 필요합니다." });
    ws.close(4001, "unauthorized");
    return;
  }

  const client: Client = { ws, user, sheetId: null };
  clients.add(client);

  ws.on("message", async (data) => {
    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      return;
    }
    try {
      await handleMessage(client, parsed);
    } catch (err) {
      console.error("ws handle error:", err);
      send(ws, { type: "error", message: "처리 중 오류가 발생했습니다." });
    }
  });

  ws.on("close", () => {
    releaseLocksOf(client);
    clients.delete(client);
  });
});

console.log(`🔌 WebSocket 서버 실행: ws://0.0.0.0:${PORT}`);
