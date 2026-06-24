"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { newMemberSchema } from "@/lib/validation";

export type MemberFormState = { error?: string; ok?: string };

/** 회원 추가 (관리자 전용). */
export async function createMember(
  _prev: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  await requireAdmin();

  const parsed = newMemberSchema.safeParse({
    username: formData.get("username"),
    name: formData.get("name"),
    department: formData.get("department") || undefined,
    password: formData.get("password"),
    role: formData.get("role") || "member",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  const { username, name, department, password, role } = parsed.data;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing.length > 0) {
    return { error: "이미 존재하는 아이디입니다." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    username,
    name,
    department: department || null,
    passwordHash,
    role,
    email: null,
  });

  revalidatePath("/admin/members");
  return { ok: `${name}(${username}) 계정을 추가했습니다.` };
}

/** 권한 변경 (admin ↔ member). */
export async function updateMemberRole(formData: FormData) {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  const role = String(formData.get("role"));
  if (!Number.isInteger(id) || (role !== "admin" && role !== "member")) return;

  // 본인 권한은 강등 못 하게 (관리자 0명 사고 방지)
  if (id === Number(me.id) && role !== "admin") {
    throw new Error("본인 권한은 변경할 수 없습니다.");
  }

  await db.update(users).set({ role }).where(eq(users.id, id));
  revalidatePath("/admin/members");
}

/** 비밀번호 초기화. */
export async function resetMemberPassword(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const newPassword = String(formData.get("password") ?? "").trim();
  if (!Number.isInteger(id) || newPassword.length < 4) {
    throw new Error("새 비밀번호는 4자 이상이어야 합니다.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
  revalidatePath("/admin/members");
}

/** 회원 삭제 (작성한 글·댓글도 cascade 삭제됨). 본인은 삭제 불가. */
export async function deleteMember(formData: FormData) {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  if (id === Number(me.id)) {
    throw new Error("본인 계정은 삭제할 수 없습니다.");
  }

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/members");
}
