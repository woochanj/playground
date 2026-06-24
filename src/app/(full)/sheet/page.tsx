import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getSheets } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { deleteSheet } from "@/app/actions/sheet";
import NewSheetButton from "./NewSheetButton";

export default async function SheetListPage() {
  await requireUser("/sheet");
  const list = await getSheets();

  return (
    <div className="mx-auto w-full max-w-[920px] px-6 py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            공유 시트
          </h1>
          <p className="mt-1 text-[15px] text-body">
            여러 명이 동시에 편집하는 표예요. 파일처럼 만들고 지울 수 있어요.
          </p>
        </div>
        <NewSheetButton />
      </header>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-16 text-center">
          <p className="text-[15px] text-muted">아직 시트가 없어요.</p>
          <p className="mt-1 text-sm text-muted">
            오른쪽 위 “새 시트”로 첫 시트를 만들어보세요.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <li
              key={s.id}
              className="group relative rounded-2xl border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <Link href={`/sheet/${s.id}`} className="block">
                <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-fill text-3xl">
                  📊
                </div>
                <p className="truncate font-bold text-foreground">{s.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {s.rows}×{s.cols} · 입력 {Number(s.cellCount)}칸
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDateTime(s.createdAt)}
                </p>
              </Link>
              {/* 삭제 */}
              <form action={deleteSheet} className="absolute right-3 top-3">
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  aria-label="시트 삭제"
                  className="rounded-lg bg-surface/80 px-2 py-1 text-xs font-semibold text-muted opacity-0 transition-opacity hover:bg-up-soft hover:text-up group-hover:opacity-100"
                >
                  삭제
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
