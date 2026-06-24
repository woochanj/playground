/** 한국 시간 기준 날짜/시간 포맷. */
export function formatDateTime(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(d);
}

/** 목록용 짧은 날짜(오늘이면 시:분, 아니면 월/일). */
export function formatListDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  return new Intl.DateTimeFormat("ko-KR", {
    ...(sameDay
      ? { hour: "2-digit", minute: "2-digit", hour12: false }
      : { month: "2-digit", day: "2-digit" }),
    timeZone: "Asia/Seoul",
  }).format(d);
}

/** 바이트 → 사람이 읽기 쉬운 크기. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}
