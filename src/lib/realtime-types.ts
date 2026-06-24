// WS 서버 ↔ 클라이언트 공유 메시지 타입.
// 채팅(chat:*)과 시트(sheet:*)가 하나의 WS 연결을 공유한다.

export type WsUser = {
  id: number;
  name: string;
};

// ── 클라이언트 → 서버 ──
export type ClientMessage =
  // 채팅: 메시지 전송
  | { type: "chat:send"; content: string }
  // 시트: 특정 시트 구독 시작
  | { type: "sheet:join"; sheetId: number }
  // 시트: 셀 편집 시작(잠금 요청)
  | { type: "sheet:lock"; sheetId: number; row: number; col: number }
  // 시트: 편집 종료(잠금 해제)
  | { type: "sheet:unlock"; sheetId: number; row: number; col: number }
  // 시트: 셀 값 확정 저장
  | { type: "sheet:set"; sheetId: number; row: number; col: number; value: string }
  // 시트: 여러 셀 일괄 저장 (붙여넣기)
  | {
      type: "sheet:set-bulk";
      sheetId: number;
      cells: { row: number; col: number; value: string }[];
    }
  // 시트: 열 너비 / 행 높이 변경 (dim: "col" | "row")
  | { type: "sheet:resize"; sheetId: number; dim: "col" | "row"; index: number; size: number };

// ── 서버 → 클라이언트 ──
export type ChatMessagePayload = {
  id: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
};

export type CellPayload = {
  row: number;
  col: number;
  value: string;
};

export type LockPayload = {
  row: number;
  col: number;
  userId: number;
  userName: string;
};

export type ServerMessage =
  // 채팅: 새 메시지 브로드캐스트
  | { type: "chat:new"; message: ChatMessagePayload }
  // 시트: 초기 스냅샷(셀 + 잠금 + 열너비/행높이)
  | {
      type: "sheet:snapshot";
      sheetId: number;
      cells: CellPayload[];
      locks: LockPayload[];
      colWidths: Record<string, number>;
      rowHeights: Record<string, number>;
    }
  // 시트: 열/행 크기 변경 브로드캐스트
  | { type: "sheet:resize"; sheetId: number; dim: "col" | "row"; index: number; size: number }
  // 시트: 셀 값 변경 브로드캐스트
  | { type: "sheet:cell"; sheetId: number; row: number; col: number; value: string; userId: number }
  // 시트: 여러 셀 일괄 변경 브로드캐스트 (붙여넣기)
  | {
      type: "sheet:cells";
      sheetId: number;
      cells: { row: number; col: number; value: string }[];
      userId: number;
    }
  // 시트: 셀 잠김
  | { type: "sheet:locked"; sheetId: number; lock: LockPayload }
  // 시트: 셀 잠금 해제
  | { type: "sheet:unlocked"; sheetId: number; row: number; col: number }
  // 잠금 요청 거부(이미 다른 사람이 점유)
  | { type: "sheet:lock-denied"; sheetId: number; row: number; col: number; byName: string }
  // 오류
  | { type: "error"; message: string };

// 기본 셀 크기(px)와 리사이즈 한계
export const DEFAULT_COL_WIDTH = 100;
export const DEFAULT_ROW_HEIGHT = 32;
export const MIN_COL_WIDTH = 48;
export const MAX_COL_WIDTH = 600;
export const MIN_ROW_HEIGHT = 24;
export const MAX_ROW_HEIGHT = 300;

// 사용자별 커서/잠금 색상 팔레트 (토스 톤)
export const USER_COLORS = [
  "#2272EB", // 토스 블루
  "#F04452", // 토스 빨강
  "#15B886", // 그린
  "#FF9500", // 오렌지
  "#8B5CF6", // 퍼플
  "#EC4899", // 핑크
] as const;

export function colorForUser(userId: number): string {
  return USER_COLORS[userId % USER_COLORS.length];
}
