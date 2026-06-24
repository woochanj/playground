import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// 허용 확장자/최대 크기 (내부망 기준 보수적으로)
const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const BLOCKED_EXT = new Set([
  ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".js", ".jar", ".sh", ".ps1",
]);

export type SavedFile = {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
};

/** 업로드 루트 절대 경로. */
export function uploadRoot() {
  return path.resolve(process.cwd(), UPLOAD_DIR);
}

/** 저장 파일명으로 절대 경로 (경로 탈출 방지). */
export function resolveStored(storedName: string) {
  const root = uploadRoot();
  const full = path.resolve(root, storedName);
  // 디렉터리 탈출 차단
  if (!full.startsWith(root + path.sep)) {
    throw new Error("잘못된 파일 경로입니다.");
  }
  return full;
}

/** FormData의 File 하나를 디스크에 저장. 빈 파일은 null 반환. */
export async function saveUpload(file: File): Promise<SavedFile | null> {
  if (!file || file.size === 0) return null;

  if (file.size > MAX_SIZE) {
    throw new Error("파일 크기는 20MB를 넘을 수 없습니다.");
  }

  const ext = path.extname(file.name).toLowerCase();
  if (BLOCKED_EXT.has(ext)) {
    throw new Error(`허용되지 않는 파일 형식입니다: ${ext}`);
  }

  const root = uploadRoot();
  await mkdir(root, { recursive: true });

  const storedName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(root, storedName), buffer);

  return {
    originalName: file.name,
    storedName,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}

/** 디스크 파일 삭제(없어도 무시). */
export async function deleteStored(storedName: string) {
  try {
    await unlink(resolveStored(storedName));
  } catch {
    // 이미 없으면 무시
  }
}
