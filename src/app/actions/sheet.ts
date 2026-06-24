"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sheets } from "@/db/schema";
import { requireUser } from "@/lib/session";

/** 새 시트 생성 후 편집 화면으로 이동. */
export async function createSheet(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim() || "제목 없는 시트";
  const rows = Math.min(500, Math.max(10, Number(formData.get("rows")) || 50));
  const cols = Math.min(52, Math.max(5, Number(formData.get("cols")) || 12));

  const [created] = await db
    .insert(sheets)
    .values({ name: name.slice(0, 128), rows, cols })
    .returning({ id: sheets.id });

  revalidatePath("/sheet");
  redirect(`/sheet/${created.id}`);
}

/** 시트 삭제 (셀은 cascade). 작성자 구분 없이 사내 공용이므로 로그인 사용자면 가능. */
export async function deleteSheet(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await db.delete(sheets).where(eq(sheets.id, id));
  revalidatePath("/sheet");
}

/** 시트 이름 변경. */
export async function renameSheet(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!Number.isInteger(id) || !name) return;

  await db.update(sheets).set({ name: name.slice(0, 128) }).where(eq(sheets.id, id));
  revalidatePath("/sheet");
  revalidatePath(`/sheet/${id}`);
}
