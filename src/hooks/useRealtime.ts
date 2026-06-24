"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage } from "@/lib/realtime-types";

type Status = "connecting" | "open" | "closed";

/** 접속 호스트 기준으로 WS URL 계산 (동료가 호스트 IP로 접속해도 동작). */
function wsUrl(): string {
  const port = process.env.NEXT_PUBLIC_WS_PORT || "3101";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.hostname}:${port}`;
}

/**
 * 단일 WS 연결을 관리. onMessage로 서버 메시지를 받고, send로 전송.
 * 연결이 끊기면 자동 재연결한다.
 */
export function useRealtime(onMessage: (msg: ServerMessage) => void) {
  const [status, setStatus] = useState<Status>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(onMessage);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByUs = useRef(false);

  // 최신 핸들러 유지
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    setStatus("connecting");
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;

    ws.onopen = () => setStatus("open");
    ws.onmessage = (e) => {
      try {
        handlerRef.current(JSON.parse(e.data) as ServerMessage);
      } catch {
        // 무시
      }
    };
    ws.onclose = () => {
      setStatus("closed");
      if (!closedByUs.current) {
        // 2초 후 재연결
        reconnectRef.current = setTimeout(connect, 2000);
      }
    };
    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    closedByUs.current = false;
    connect();
    return () => {
      closedByUs.current = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  return { status, send };
}
