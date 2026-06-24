import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoardBySlug, getPostsByBoard } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { formatListDate } from "@/lib/format";
import Pagination from "@/components/Pagination";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const board = await getBoardBySlug(slug);
  if (!board) notFound();

  const [{ rows, total, pageSize }, user] = await Promise.all([
    getPostsByBoard(board.id, page),
    getCurrentUser(),
  ]);

  // 글쓰기 권한: 로그인 필요 + 공지 게시판이면 관리자만
  const canWrite = !!user && (!board.adminOnly || user.role === "admin");

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-1.5 text-2xl font-extrabold tracking-tight text-foreground">
            <span className="text-muted">#</span>
            {board.name}
          </h1>
          {board.description && (
            <p className="mt-1 text-[15px] text-body">{board.description}</p>
          )}
        </div>
        {canWrite && (
          <Link
            href={`/boards/${board.slug}/new`}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            글쓰기
          </Link>
        )}
      </header>

      <div className="overflow-hidden toss-card">
        {rows.length === 0 ? (
          <p className="px-5 py-16 text-center text-[15px] text-muted">
            아직 게시글이 없습니다.
            {canWrite && " 첫 글을 남겨보세요."}
          </p>
        ) : (
          <ul>
            {rows.map((p) => (
              <li
                key={p.id}
                className="border-b border-border last:border-0 transition-colors hover:bg-hover"
              >
                <Link
                  href={`/posts/${p.id}`}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {p.pinned && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                          고정
                        </span>
                      )}
                      <span className="truncate font-semibold text-foreground">
                        {p.title}
                      </span>
                      {Number(p.commentCount) > 0 && (
                        <span className="text-sm font-semibold text-primary">
                          {Number(p.commentCount)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {p.authorName} · 조회 {p.views}
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] text-muted">
                    {formatListDate(p.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Pagination
        basePath={`/boards/${board.slug}`}
        page={page}
        total={total}
        pageSize={pageSize}
      />
    </div>
  );
}
