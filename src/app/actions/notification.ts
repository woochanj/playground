"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/session";

/** 알림 1개 읽음 처리 후 링크로 이동(링크는 클라이언트에서 따라감). */
export async function markNotificationRead(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, Number(user.id)),
      ),
    );

  revalidatePath("/notifications");
}

/** 내 알림 전체 읽음 처리. */
export async function markAllNotificationsRead() {
  const user = await requireUser();

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.userId, Number(user.id)),
        eq(notifications.read, false),
      ),
    );

  revalidatePath("/notifications");
}
