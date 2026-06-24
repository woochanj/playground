"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, posts, notifications } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { commentSchema } from "@/lib/validation";

export type CommentFormState = { error?: string };

/** 댓글 작성. 글 작성자에게 알림 생성(본인 글 제외). */
export async function createComment(
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const user = await requireUser();
  const postId = Number(formData.get("postId"));

  const parsed = commentSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "댓글을 확인하세요." };
  }

  const [post] = await db
    .select({ authorId: posts.authorId, title: posts.title })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);
  if (!post) return { error: "게시글을 찾을 수 없습니다." };

  await db.insert(comments).values({
    postId,
    authorId: Number(user.id),
    content: parsed.data.content,
  });

  // 내 글이 아니면 작성자에게 알림
  if (post.authorId !== Number(user.id)) {
    await db.insert(notifications).values({
      userId: post.authorId,
      message: `${user.name}님이 "${post.title}" 글에 댓글을 남겼습니다.`,
      link: `/posts/${postId}`,
    });
  }

  revalidatePath(`/posts/${postId}`);
  return {};
}

/** 댓글 삭제. 본인 또는 관리자만. */
export async function deleteComment(formData: FormData) {
  const user = await requireUser();
  const commentId = Number(formData.get("commentId"));
  const postId = Number(formData.get("postId"));

  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!comment) return;

  if (comment.authorId !== Number(user.id) && user.role !== "admin") {
    throw new Error("삭제 권한이 없습니다.");
  }

  await db.delete(comments).where(eq(comments.id, commentId));
  revalidatePath(`/posts/${postId}`);
}
