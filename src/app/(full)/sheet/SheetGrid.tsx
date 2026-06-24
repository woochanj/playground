"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { colorForUser, type ServerMessage } from "@/lib/realtime-types";

type Props = {
  sheetId: number;
  sheetName: string;
  rows: number;
  cols: number;
  currentUserId: number;
};

type Lock = { userId: number; userName: string };

function colLabel(i: number): string {
  // 0->A, 25->Z, 26->AA ...
  let s = "";
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function key(row: number, col: number) {
  return `${row}:${col}`;
}

export default function SheetGrid({ sheetId, sheetName, rows, cols, currentUserId }: Props) {
  // 셀 값
  const [cells, setCells] = useState<Map<string, string>>(new Map());
  // 다른 사용자 잠금 (내 잠금 제외하고 표시용)
  const [locks, setLocks] = useState<Map<string, Lock>>(new Map());
  // 내가 편집 중인 셀
  const [editing, setEditing] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [denied, setDenied] = useState<string | null>(null);

  const editingRef = useRef(editing);
  editingRef.current = editing;

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "sheet:snapshot": {
          if (msg.sheetId !== sheetId) return;
          const m = new Map<string, string>();
          for (const c of msg.cells) m.set(key(c.row, c.col), c.value);
          setCells(m);
          const lk = new Map<string, Lock>();
          for (const l of msg.locks) {
            if (l.userId !== currentUserId)
              lk.set(key(l.row, l.col), { userId: l.userId, userName: l.userName });
          }
          setLocks(lk);
          break;
        }
        case "sheet:cell": {
          if (msg.sheetId !== sheetId) return;
          setCells((prev) => {
            const next = new Map(prev);
            next.set(key(msg.row, msg.col), msg.value);
            return next;
          });
          break;
        }
        case "sheet:locked": {
          if (msg.sheetId !== sheetId) return;
          if (msg.lock.userId === currentUserId) return;
          setLocks((prev) => {
            const next = new Map(prev);
            next.set(key(msg.lock.row, msg.lock.col), {
              userId: msg.lock.userId,
              userName: msg.lock.userName,
            });
            return next;
          });
          break;
        }
        case "sheet:unlocked": {
          if (msg.sheetId !== sheetId) return;
          setLocks((prev) => {
            const next = new Map(prev);
            next.delete(key(msg.row, msg.col));
            return next;
          });
          break;
        }
        case "sheet:lock-denied": {
          if (msg.sheetId !== sheetId) return;
          setDenied(`${msg.byName}님이 편집 중인 셀입니다.`);
          setTimeout(() => setDenied(null), 2500);
          break;
        }
      }
    },
    [sheetId, currentUserId],
  );

  const { status, send } = useRealtime(handleMessage);

  // 연결되면 시트 구독
  useEffect(() => {
    if (status === "open") send({ type: "sheet:join", sheetId });
  }, [status, sheetId, send]);

  const startEdit = (row: number, col: number) => {
    if (editing) commitEdit();
    // 다른 사람이 잠갔으면 거부
    if (locks.has(key(row, col))) {
      setDenied(`${locks.get(key(row, col))!.userName}님이 편집 중입니다.`);
      setTimeout(() => setDenied(null), 2500);
      return;
    }
    send({ type: "sheet:lock", sheetId, row, col });
    setEditing({ row, col });
    setEditValue(cells.get(key(row, col)) ?? "");
  };

  const commitEdit = useCallback(() => {
    const e = editingRef.current;
    if (!e) return;
    send({ type: "sheet:set", sheetId, row: e.row, col: e.col, value: editValue });
    send({ type: "sheet:unlock", sheetId, row: e.row, col: e.col });
    setEditing(null);
  }, [editValue, sheetId, send]);

  const cancelEdit = () => {
    const e = editingRef.current;
    if (!e) return;
    send({ type: "sheet:unlock", sheetId, row: e.row, col: e.col });
    setEditing(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-3 flex items-center gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          {sheetName}
        </h1>
        <span
          className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            status === "open" ? "bg-[#15B886]/10 text-[#15B886]" : "bg-fill text-muted"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === "open" ? "bg-[#15B886]" : "bg-muted"
            }`}
          />
          {status === "open" ? "실시간 연결됨" : status === "connecting" ? "연결 중…" : "연결 끊김"}
        </span>
        {denied && (
          <span className="ml-2 rounded-lg bg-up-soft px-2.5 py-1 text-xs font-medium text-up">
            {denied}
          </span>
        )}
      </header>

      <p className="mb-3 text-sm text-muted">
        셀을 클릭하면 편집할 수 있어요. 같은 셀은 한 명만 동시에 편집할 수 있고, 다른
        사람이 편집 중인 셀에는 그 사람 색의 테두리가 표시됩니다.
      </p>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-surface">
        <table className="border-collapse text-sm">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 w-12 border-b border-r border-border bg-fill" />
              {Array.from({ length: cols }, (_, c) => (
                <th
                  key={c}
                  className="min-w-24 border-b border-r border-border bg-fill px-2 py-1.5 text-xs font-semibold text-muted"
                >
                  {colLabel(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                <td className="sticky left-0 z-10 border-b border-r border-border bg-fill px-2 py-1.5 text-center text-xs font-semibold text-muted">
                  {r + 1}
                </td>
                {Array.from({ length: cols }, (_, c) => {
                  const k = key(r, c);
                  const lock = locks.get(k);
                  const isEditing = editing?.row === r && editing?.col === c;
                  const value = cells.get(k) ?? "";
                  return (
                    <td
                      key={c}
                      onClick={() => !isEditing && startEdit(r, c)}
                      className="relative min-w-24 cursor-cell border-b border-r border-border p-0"
                      style={
                        lock
                          ? { boxShadow: `inset 0 0 0 2px ${colorForUser(lock.userId)}` }
                          : isEditing
                            ? { boxShadow: "inset 0 0 0 2px var(--primary)" }
                            : undefined
                      }
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitEdit();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEdit();
                            }
                          }}
                          className="h-full w-full px-2 py-1.5 outline-none"
                        />
                      ) : (
                        <div className="truncate px-2 py-1.5 text-foreground">
                          {value}
                        </div>
                      )}
                      {/* 다른 사람 커서 라벨 */}
                      {lock && (
                        <span
                          className="pointer-events-none absolute -top-2 left-0 z-20 rounded px-1 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: colorForUser(lock.userId) }}
                        >
                          {lock.userName}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
