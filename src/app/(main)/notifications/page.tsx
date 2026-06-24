import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getNotifications } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/actions/notification";

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const items = await getNotifications(Number(user.id));
  const hasUnread = items.some((n) => !n.read);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          알림
        </h1>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
            >
              모두 읽음
            </button>
          </form>
        )}
      </header>

      {items.length === 0 ? (
        <p className="toss-card px-5 py-16 text-center text-[15px] text-muted">
          알림이 없습니다.
        </p>
      ) : (
        <ul className="overflow-hidden toss-card">
          {items.map((n) => (
            <li
              key={n.id}
              className={`border-b border-border last:border-0 ${
                n.read ? "" : "bg-primary-soft/40"
              }`}
            >
              <div className="flex items-center gap-3 px-5 py-3.5">
                {!n.read && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
                <div className="min-w-0 flex-1">
                  {n.link ? (
                    <Link
                      href={n.link}
                      className="block text-[15px] text-foreground hover:text-primary"
                    >
                      {n.message}
                    </Link>
                  ) : (
                    <span className="block text-[15px] text-foreground">
                      {n.message}
                    </span>
                  )}
                  <span className="mt-0.5 block text-xs text-muted">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
                {!n.read && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="shrink-0 text-xs text-muted transition-colors hover:text-foreground"
                    >
                      읽음
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
