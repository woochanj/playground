"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import {
  colorForUser,
  DEFAULT_COL_WIDTH,
  DEFAULT_ROW_HEIGHT,
  MIN_COL_WIDTH,
  MAX_COL_WIDTH,
  MIN_ROW_HEIGHT,
  MAX_ROW_HEIGHT,
  type ServerMessage,
} from "@/lib/realtime-types";

type Props = {
  sheetId: number;
  sheetName: string;
  rows: number;
  cols: number;
  currentUserId: number;
};

type Lock = { userId: number; userName: string };

const ROW_HEADER_W = 48; // 행 번호 열 너비(px)

function colLabel(i: number): string {
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

export default function SheetGrid({
  sheetId,
  sheetName,
  rows,
  cols,
  currentUserId,
}: Props) {
  const [cells, setCells] = useState<Map<string, string>>(new Map());
  const [locks, setLocks] = useState<Map<string, Lock>>(new Map());
  const [editing, setEditing] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [denied, setDenied] = useState<string | null>(null);
  // 열 너비 / 행 높이 오버라이드 (기본값과 다른 것만)
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});

  const editingRef = useRef(editing);
  editingRef.current = editing;

  const colW = (c: number) => colWidths[String(c)] ?? DEFAULT_COL_WIDTH;
  const rowH = (r: number) => rowHeights[String(r)] ?? DEFAULT_ROW_HEIGHT;

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
          setColWidths(msg.colWidths ?? {});
          setRowHeights(msg.rowHeights ?? {});
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
        case "sheet:resize": {
          if (msg.sheetId !== sheetId) return;
          const setter = msg.dim === "col" ? setColWidths : setRowHeights;
          setter((prev) => ({ ...prev, [String(msg.index)]: msg.size }));
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

  useEffect(() => {
    if (status === "open") send({ type: "sheet:join", sheetId });
  }, [status, sheetId, send]);

  const commitEdit = useCallback(() => {
    const e = editingRef.current;
    if (!e) return;
    send({ type: "sheet:set", sheetId, row: e.row, col: e.col, value: editValue });
    send({ type: "sheet:unlock", sheetId, row: e.row, col: e.col });
    setEditing(null);
  }, [editValue, sheetId, send]);

  const startEdit = (row: number, col: number) => {
    if (editing) commitEdit();
    if (locks.has(key(row, col))) {
      setDenied(`${locks.get(key(row, col))!.userName}님이 편집 중입니다.`);
      setTimeout(() => setDenied(null), 2500);
      return;
    }
    send({ type: "sheet:lock", sheetId, row, col });
    setEditing({ row, col });
    setEditValue(cells.get(key(row, col)) ?? "");
  };

  const cancelEdit = () => {
    const e = editingRef.current;
    if (!e) return;
    send({ type: "sheet:unlock", sheetId, row: e.row, col: e.col });
    setEditing(null);
  };

  // ── 드래그 리사이즈 ──
  const dragRef = useRef<{
    dim: "col" | "row";
    index: number;
    start: number;
    startSize: number;
  } | null>(null);

  const onResizeStart = (
    dim: "col" | "row",
    index: number,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      dim,
      index,
      start: dim === "col" ? e.clientX : e.clientY,
      startSize: dim === "col" ? colW(index) : rowH(index),
    };

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const delta = (d.dim === "col" ? ev.clientX : ev.clientY) - d.start;
      const raw = d.startSize + delta;
      const size =
        d.dim === "col"
          ? Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, raw))
          : Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, raw));
      // 로컬 즉시 반영
      const setter = d.dim === "col" ? setColWidths : setRowHeights;
      setter((prev) => ({ ...prev, [String(d.index)]: Math.round(size) }));
    };

    const onUp = () => {
      const d = dragRef.current;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (d) {
        const size = d.dim === "col" ? colWRef.current(d.index) : rowHRef.current(d.index);
        send({ type: "sheet:resize", sheetId, dim: d.dim, index: d.index, size });
      }
      dragRef.current = null;
    };

    document.body.style.cursor = dim === "col" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // 드래그 종료 시점에 최신 크기를 읽기 위한 ref
  const colWRef = useRef(colW);
  const rowHRef = useRef(rowH);
  colWRef.current = colW;
  rowHRef.current = rowH;

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
          {status === "open"
            ? "실시간 연결됨"
            : status === "connecting"
              ? "연결 중…"
              : "연결 끊김"}
        </span>
        {denied && (
          <span className="ml-2 rounded-lg bg-up-soft px-2.5 py-1 text-xs font-medium text-up">
            {denied}
          </span>
        )}
      </header>

      <p className="mb-3 text-sm text-muted">
        셀을 클릭해 편집하세요. 열·행 머리글의 경계선을 드래그하면 크기를 조절할 수
        있고, 변경은 모두에게 실시간으로 공유됩니다.
      </p>

      <div className="min-h-0 flex-1 overflow-auto toss-card">
        <table className="border-collapse text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: ROW_HEADER_W }} />
            {Array.from({ length: cols }, (_, c) => (
              <col key={c} style={{ width: colW(c) }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr style={{ height: DEFAULT_ROW_HEIGHT }}>
              <th className="sticky left-0 z-30 border-b border-r border-border bg-fill" />
              {Array.from({ length: cols }, (_, c) => (
                <th
                  key={c}
                  className="relative border-b border-r border-border bg-fill px-2 text-xs font-semibold text-muted"
                >
                  {colLabel(c)}
                  {/* 열 너비 리사이즈 핸들 */}
                  <span
                    onMouseDown={(e) => onResizeStart("col", c, e)}
                    className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize hover:bg-primary/30"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r} style={{ height: rowH(r) }}>
                <td className="sticky left-0 z-10 border-b border-r border-border bg-fill text-center text-xs font-semibold text-muted">
                  <div className="relative">
                    {r + 1}
                    {/* 행 높이 리사이즈 핸들 */}
                    <span
                      onMouseDown={(e) => onResizeStart("row", r, e)}
                      className="absolute -bottom-2 left-0 z-10 h-2 w-full cursor-row-resize hover:bg-primary/30"
                    />
                  </div>
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
                      className="relative cursor-cell border-b border-r border-border p-0 align-top"
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
                          className="h-full w-full bg-surface px-2 py-1 outline-none"
                        />
                      ) : (
                        <div className="h-full overflow-hidden truncate px-2 py-1 text-foreground">
                          {value}
                        </div>
                      )}
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
