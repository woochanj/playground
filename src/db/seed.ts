import { config } from "dotenv";
config({ path: ".env" });

import bcrypt from "bcryptjs";
import { db } from "./index";
import { users, boards, sheets } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 시드 시작...");

  // ── 기본 게시판(채널) ──
  const defaultBoards = [
    { slug: "notice", name: "공지사항", description: "전사 공지", adminOnly: true, sortOrder: 0 },
    { slug: "free", name: "자유게시판", description: "자유롭게 이야기해요", adminOnly: false, sortOrder: 1 },
    { slug: "qna", name: "질문답변", description: "궁금한 걸 물어보세요", adminOnly: false, sortOrder: 2 },
    { slug: "share", name: "자료실", description: "파일·자료 공유", adminOnly: false, sortOrder: 3 },
  ];

  for (const b of defaultBoards) {
    const existing = await db.select().from(boards).where(eq(boards.slug, b.slug));
    if (existing.length === 0) {
      await db.insert(boards).values(b);
      console.log(`  + 게시판 생성: #${b.slug} (${b.name})`);
    }
  }

  // ── 관리자 계정 ──
  const adminUsername = "admin";
  const existingAdmin = await db.select().from(users).where(eq(users.username, adminUsername));
  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash("admin1234", 10);
    await db.insert(users).values({
      username: adminUsername,
      name: "관리자",
      email: "admin@company.local",
      department: "운영팀",
      passwordHash,
      role: "admin",
    });
    console.log("  + 관리자 계정 생성: admin / admin1234  (로그인 후 비밀번호를 꼭 변경하세요)");
  } else {
    console.log("  · 관리자 계정이 이미 있습니다.");
  }

  // ── 기본 공유 시트 ──
  const existingSheet = await db.select().from(sheets).limit(1);
  if (existingSheet.length === 0) {
    await db.insert(sheets).values({ name: "공유 시트", rows: 50, cols: 12 });
    console.log("  + 공유 시트 생성: 공유 시트 (50×12)");
  }

  console.log("✅ 시드 완료");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ 시드 실패:", err);
  process.exit(1);
});
