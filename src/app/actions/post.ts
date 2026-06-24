"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { posts, boards, attachments } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { postSchema } from "@/lib/validation";
import { saveUpload, deleteStored } from "@/lib/upload";
import { getAttachmentsByPost } from "@/lib/queries";

export type PostFormState = { error?: string };

/** 게시글 작성. 성공 시 작성된 글로 이동. */
export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireUser();

  const boardId = Number(formData.get("boardId"));
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1);
  if (!board) return { error: "게시판을 찾을 수 없습니다." };

  // 공지 게시판은 관리자만
  if (board.adminOnly && user.role !== "admin") {
    return { error: "이 게시판에는 글을 쓸 권한이 없습니다." };
  }

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  // 첨부파일 저장
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  let saved;
  try {
    saved = (await Promise.all(files.map(saveUpload))).filter(
      (f): f is NonNullable<typeof f> => f !== null,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "파일 업로드 실패" };
  }

  const [created] = await db
    .insert(posts)
    .values({
      boardId,
      authorId: Number(user.id),
      title: parsed.data.title,
      content: parsed.data.content,
    })
    .returning({ id: posts.id });

  if (saved.length > 0) {
    await db.insert(attachments).values(
      saved.map((f) => ({
        postId: created.id,
        originalName: f.originalName,
        storedName: f.storedName,
        mimeType: f.mimeType,
        size: f.size,
      })),
    );
  }

  revalidatePath(`/boards/${board.slug}`);
  redirect(`/posts/${created.id}`);
}

/** 게시글 수정. 본인 또는 관리자만. */
export async function updatePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireUser();
  const postId = Number(formData.get("postId"));

  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return { error: "게시글을 찾을 수 없습니다." };

  if (post.authorId !== Number(user.id) && user.role !== "admin") {
    return { error: "수정 권한이 없습니다." };
  }

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }

  await db
    .update(posts)
    .set({
      title: parsed.data.title,
      content: parsed.data.content,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));

  // 새 첨부파일 추가(기존 유지)
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  try {
    const saved = (await Promise.all(files.map(saveUpload))).filter(
      (f): f is NonNullable<typeof f> => f !== null,
    );
    if (saved.length > 0) {
      await db.insert(attachments).values(
        saved.map((f) => ({
          postId,
          originalName: f.originalName,
          storedName: f.storedName,
          mimeType: f.mimeType,
          size: f.size,
        })),
      );
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "파일 업로드 실패" };
  }

  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}

/** 게시글 삭제. 본인 또는 관리자만. 첨부파일도 함께 삭제. */
export async function deletePost(formData: FormData) {
  const user = await requireUser();
  const postId = Number(formData.get("postId"));

  const post = await db
    .select({
      authorId: posts.authorId,
      boardSlug: boards.slug,
    })
    .from(posts)
    .innerJoin(boards, eq(posts.boardId, boards.id))
    .where(eq(posts.id, postId))
    .limit(1);

  const target = post[0];
  if (!target) return;

  if (target.authorId !== Number(user.id) && user.role !== "admin") {
    throw new Error("삭제 권한이 없습니다.");
  }

  // 디스크 파일 먼저 정리 (DB는 cascade)
  const files = await getAttachmentsByPost(postId);
  await Promise.all(files.map((f) => deleteStored(f.storedName)));

  await db.delete(posts).where(eq(posts.id, postId));

  revalidatePath(`/boards/${target.boardSlug}`);
  redirect(`/boards/${target.boardSlug}`);
}

/** 개별 첨부파일 삭제 (수정 화면에서 사용). */
export async function deleteAttachment(formData: FormData) {
  const user = await requireUser();
  const attachmentId = Number(formData.get("attachmentId"));
  const postId = Number(formData.get("postId"));

  const [att] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, attachmentId))
    .limit(1);
  if (!att) return;

  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, att.postId))
    .limit(1);
  if (!post) return;

  if (post.authorId !== Number(user.id) && user.role !== "admin") {
    throw new Error("권한이 없습니다.");
  }

  await deleteStored(att.storedName);
  await db.delete(attachments).where(eq(attachments.id, attachmentId));

  revalidatePath(`/posts/${postId}`);
}
