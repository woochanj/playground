"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { colorForUser, type ServerMessage, type ChatMessagePayload } from "@/lib/realtime-types";
import { formatDateTime } from "@/lib/format";

type Props = {
  currentUserId: number;
  initialMessages: ChatMessagePayload[];
};

export default function ChatRoom({ currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessagePayload[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleMessage = useCallback((msg: ServerMessage) => {
    if (msg.type === "chat:new") {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.message.id) ? prev : [...prev, msg.message],
      );
    }
  }, []);

  const { status, send } = useRealtime(handleMessage);

  // 새 메시지 도착 시 맨 아래로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const content = draft.trim();
    if (!content) return;
    if (send({ type: "chat:send", content })) {
      setDraft("");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="mb-3 flex items-center gap-2">
        <h1 className="flex items-center gap-1.5 text-2xl font-extrabold tracking-tight text-foreground">
          <span className="text-muted">#</span> 전체 채팅
        </h1>
        <span
          className={`ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            status === "open"
              ? "bg-[#15B886]/10 text-[#15B886]"
              : "bg-fill text-muted"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === "open" ? "bg-[#15B886]" : "bg-muted"
            }`}
          />
          {status === "open" ? "실시간 연결됨" : status === "connecting" ? "연결 중…" : "연결 끊김"}
        </span>
      </header>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto toss-card p-4">
        {messages.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            아직 메시지가 없습니다. 첫 인사를 남겨보세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => {
              const mine = m.authorId === currentUserId;
              return (
                <li key={m.id} className="flex gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: colorForUser(m.authorId) }}
                  >
                    {m.authorName.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {m.authorName}
                        {mine && <span className="ml-1 text-xs text-primary">나</span>}
                      </span>
                      <span className="text-xs text-muted">
                        {formatDateTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="post-body mt-0.5 text-[15px] text-body">{m.content}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
          className="toss-input max-h-32 flex-1 resize-none text-sm"
        />
        <button
          onClick={submit}
          disabled={status !== "open" || !draft.trim()}
          className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
