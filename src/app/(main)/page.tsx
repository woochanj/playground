import Link from "next/link";
import { getBoards } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const [boards, user] = await Promise.all([getBoards(), getCurrentUser()]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          {user ? `${user.name}님, 환영해요` : "SmallHolland"}
        </h1>
        <p className="mt-1 text-[15px] text-body">
          채널을 골라 소식을 확인하고 이야기를 나눠보세요.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {boards.map((b) => (
          <Link
            key={b.id}
            href={`/boards/${b.slug}`}
            className="group toss-card p-5 transition-all hover:-translate-y-0.5 hover:bg-primary-soft/30"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-muted group-hover:text-primary">#</span>
              <span className="font-bold text-foreground">{b.name}</span>
              {b.adminOnly && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                  공지
                </span>
              )}
            </div>
            {b.description && (
              <p className="mt-1.5 text-sm text-body">{b.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
