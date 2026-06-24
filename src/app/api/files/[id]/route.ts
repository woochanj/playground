import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { Readable } from "node:stream";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAttachmentById } from "@/lib/queries";
import { resolveStored } from "@/lib/upload";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  // 내부 자료이므로 로그인 사용자만 다운로드 허용
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await ctx.params;
  const attachmentId = Number(id);
  if (!Number.isInteger(attachmentId)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const att = await getAttachmentById(attachmentId);
  if (!att) return new NextResponse("Not Found", { status: 404 });

  let fullPath: string;
  try {
    fullPath = resolveStored(att.storedName);
    await stat(fullPath);
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }

  const nodeStream = createReadStream(fullPath);
  const webStream = Readable.toWeb(nodeStream) as NodeWebReadableStream<Uint8Array>;

  // 원본 파일명 보존 (RFC 5987로 한글/특수문자 안전 인코딩)
  const encoded = encodeURIComponent(att.originalName);

  return new NextResponse(webStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": att.mimeType,
      "Content-Length": String(att.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
    },
  });
}
