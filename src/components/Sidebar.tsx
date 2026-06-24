import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getBoards, getUnreadNotificationCount } from "@/lib/queries";
import { logoutAction } from "@/app/actions/auth";

export default async function Sidebar() {
  const user = await getCurrentUser();
  const boards = await getBoards();
  const unread = user ? await getUnreadNotificationCount(Number(user.id)) : 0;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* 워크스페이스 */}
      <div className="px-5 py-5">
        <Link
          href="/"
          className="text-[17px] font-extrabold tracking-tight text-foreground"
        >
          사내 커뮤니티
        </Link>
      </div>

      {/* 채널 목록 */}
      <nav className="flex-1 overflow-y-auto px-3">
        <p className="px-2 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          채널
        </p>
        <ul className="flex flex-col gap-0.5">
          {boards.map((b) => (
            <li key={b.id}>
              <Link
                href={`/boards/${b.slug}`}
                className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[15px] text-body transition-colors hover:bg-primary-soft hover:text-foreground"
              >
                <span className="text-muted group-hover:text-primary">#</span>
                <span className="truncate">{b.name}</span>
                {b.adminOnly && (
                  <span className="ml-auto rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    공지
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {user && (
          <>
            <p className="px-2 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              내 활동
            </p>
            <Link
              href="/notifications"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[15px] text-body transition-colors hover:bg-primary-soft hover:text-foreground"
            >
              <span>🔔</span>
              <span>알림</span>
              {unread > 0 && (
                <span className="ml-auto rounded-full bg-up px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          </>
        )}
      </nav>

      {/* 계정 */}
      <div className="border-t border-border px-3 py-3">
        {user ? (
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {user.name?.slice(0, 1) ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name}
                {user.role === "admin" && (
                  <span className="ml-1 text-[11px] font-medium text-primary">
                    관리자
                  </span>
                )}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md px-1.5 py-1 text-xs text-muted transition-colors hover:text-foreground"
              >
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="block rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            로그인
          </Link>
        )}
      </div>
    </aside>
  );
}
