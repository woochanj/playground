import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPostById,
  getCommentsByPost,
  getAttachmentsByPost,
  incrementPostViews,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { deletePost } from "@/app/actions/post";
import { deleteComment } from "@/app/actions/comment";
import CommentForm from "./CommentForm";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  // 조회수 증가(상세 진입 시)
  await incrementPostViews(postId);

  const [comments, files, user] = await Promise.all([
    getCommentsByPost(postId),
    getAttachmentsByPost(postId),
    getCurrentUser(),
  ]);

  const isAuthor = user && Number(user.id) === post.authorId;
  const canManage = isAuthor || user?.role === "admin";

  return (
    <article>
      {/* 상단 채널 이동 */}
      <Link
        href={`/boards/${post.boardSlug}`}
        className="text-sm font-medium text-muted transition-colors hover:text-primary"
      >
        ← <span className="text-muted">#</span> {post.boardName}
      </Link>

      {/* 제목 영역 */}
      <header className="mt-3 border-b border-border pb-5">
        <div className="flex items-start gap-2">
          {post.pinned && (
            <span className="mt-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
              고정
            </span>
          )}
          <h1 className="text-2xl font-extrabold leading-snug tracking-tight text-foreground">
            {post.title}
          </h1>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
          <span className="font-medium text-body">{post.authorName}</span>
          <span>·</span>
          <span>{formatDateTime(post.createdAt)}</span>
          <span>·</span>
          <span>조회 {post.views + 1}</span>
        </div>
      </header>

      {/* 본문 */}
      <div className="post-body py-6 text-[15px]">{post.content}</div>

      {/* 첨부파일 */}
      {files.length > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-sidebar p-4">
          <p className="mb-2 text-sm font-semibold text-body">
            첨부파일 {files.length}개
          </p>
          <ul className="flex flex-col gap-1.5">
            {files.map((f) => (
              <li key={f.id}>
                <a
                  href={`/api/files/${f.id}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <span>📎</span>
                  <span className="truncate">{f.originalName}</span>
                  <span className="text-xs text-muted">
                    ({formatFileSize(f.size)})
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 수정/삭제 */}
      {canManage && (
        <div className="mb-8 flex items-center gap-2">
          <Link
            href={`/posts/${postId}/edit`}
            className="rounded-lg bg-fill px-3.5 py-1.5 text-sm font-semibold text-body transition-colors hover:bg-fill-hover"
          >
            수정
          </Link>
          <form action={deletePost}>
            <input type="hidden" name="postId" value={postId} />
            <button
              type="submit"
              className="rounded-lg bg-fill px-3.5 py-1.5 text-sm font-semibold text-up transition-colors hover:bg-up-soft"
            >
              삭제
            </button>
          </form>
        </div>
      )}

      {/* 댓글 */}
      <section className="border-t border-border pt-6">
        <h2 className="mb-4 text-base font-bold text-foreground">
          댓글 {comments.length}
        </h2>

        <ul className="mb-5 flex flex-col gap-4">
          {comments.length === 0 && (
            <li className="text-sm text-muted">첫 댓글을 남겨보세요.</li>
          )}
          {comments.map((c) => {
            const canDelete =
              user && (Number(user.id) === c.authorId || user.role === "admin");
            return (
              <li key={c.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {c.authorName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {c.authorName}
                    </span>
                    <span className="text-xs text-muted">
                      {formatDateTime(c.createdAt)}
                    </span>
                    {canDelete && (
                      <form action={deleteComment} className="ml-auto">
                        <input type="hidden" name="commentId" value={c.id} />
                        <input type="hidden" name="postId" value={postId} />
                        <button
                          type="submit"
                          className="text-xs text-muted transition-colors hover:text-up"
                        >
                          삭제
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="post-body mt-0.5 text-sm">{c.content}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {user ? (
          <CommentForm postId={postId} />
        ) : (
          <p className="rounded-lg bg-sidebar px-4 py-3 text-sm text-muted">
            댓글을 작성하려면{" "}
            <Link href="/login" className="font-semibold text-primary">
              로그인
            </Link>
            하세요.
          </p>
        )}
      </section>
    </article>
  );
}
