import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  username: string;
  role: "admin" | "member";
  name?: string | null;
  email?: string | null;
};

/** 현재 세션 사용자(없으면 null). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser | undefined) ?? null;
}

/** 로그인 필수. 미로그인 시 로그인 페이지로 리다이렉트(원래 경로 보존). */
export async function requireUser(callbackPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const cb = callbackPath ? `?callbackUrl=${encodeURIComponent(callbackPath)}` : "";
    redirect(`/login${cb}`);
  }
  return user;
}

/** 관리자 필수. 미로그인은 로그인, 권한 부족은 홈으로. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/");
  }
  return user;
}
