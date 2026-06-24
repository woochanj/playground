import { notFound, redirect } from "next/navigation";
import { getPostById, getAttachmentsByPost } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { formatFileSize } from "@/lib/format";
import { deleteAttachment } from "@/app/actions/post";
import PostForm from "@/app/boards/[slug]/new/PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  const user = await requireUser(`/posts/${postId}/edit`);
  if (Number(user.id) !== post.authorId && user.role !== "admin") {
    redirect(`/posts/${postId}`);
  }

  const files = await getAttachmentsByPost(postId);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-foreground">
        글 수정
      </h1>

      {/* 기존 첨부파일 */}
      {files.length > 0 && (
        <div className="mb-5 rounded-lg border border-border bg-sidebar p-4">
          <p className="mb-2 text-sm font-semibold text-body">기존 첨부파일</p>
          <ul className="flex flex-col gap-1.5">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-2 text-sm">
                <span>📎</span>
                <span className="truncate text-body">{f.originalName}</span>
                <span className="text-xs text-muted">
                  ({formatFileSize(f.size)})
                </span>
                <form action={deleteAttachment} className="ml-auto">
                  <input type="hidden" name="attachmentId" value={f.id} />
                  <input type="hidden" name="postId" value={postId} />
                  <button
                    type="submit"
                    className="text-xs text-muted transition-colors hover:text-up"
                  >
                    삭제
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <PostForm
        mode="edit"
        postId={postId}
        cancelHref={`/posts/${postId}`}
        initial={{ title: post.title, content: post.content }}
      />
    </div>
  );
}
