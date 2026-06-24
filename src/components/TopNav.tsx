"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

type NavUser = {
  name: string;
  role: "admin" | "member";
} | null;

type NavItem = { href: string; label: string; match: (p: string) => boolean };

const ITEMS: NavItem[] = [
  { href: "/", label: "홈", match: (p) => p === "/" },
  { href: "/boards/notice", label: "게시판", match: (p) => p.startsWith("/boards") || p.startsWith("/posts") },
  { href: "/chat", label: "채팅", match: (p) => p.startsWith("/chat") },
  { href: "/sheet", label: "시트", match: (p) => p.startsWith("/sheet") },
];

export default function TopNav({
  user,
  unread,
}: {
  user: NavUser;
  unread: number;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-[52px] max-w-[1200px] items-center gap-7 px-6">
        {/* 로고 */}
        <Link href="/" className="text-[17px] font-extrabold tracking-tight text-foreground">
          사내<span className="text-primary">커뮤니티</span>
        </Link>

        {/* 메뉴 (토스: 14px / 600 / 활성 진하게) */}
        <nav className="flex items-center gap-6">
          {ITEMS.map((it) => {
            const active = it.match(pathname);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`text-sm font-semibold transition-colors ${
                  active
                    ? "text-foreground"
                    : "text-muted hover:text-body"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

        {/* 우측 */}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/notifications"
                aria-label="알림"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-body transition-colors hover:bg-fill"
              >
                <span className="text-base">🔔</span>
                {unread > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-up px-1 text-[10px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {user.name.slice(0, 1)}
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {user.name}
                  {user.role === "admin" && (
                    <span className="ml-1 text-[11px] font-medium text-primary">관리자</span>
                  )}
                </span>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-fill hover:text-body"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
