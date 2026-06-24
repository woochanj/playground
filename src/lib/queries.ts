import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  boards,
  posts,
  comments,
  users,
  attachments,
  notifications,
} from "@/db/schema";

export const PAGE_SIZE = 20;

/** 정렬된 전체 게시판 목록. */
export async function getBoards() {
  return db.select().from(boards).orderBy(boards.sortOrder, boards.id);
}

/** slug로 게시판 1개. */
export async function getBoardBySlug(slug: string) {
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.slug, slug))
    .limit(1);
  return board ?? null;
}

/** 게시판별 글 목록 (고정글 우선, 최신순) + 페이지네이션. */
export async function getPostsByBoard(boardId: number, page = 1) {
  const offset = (page - 1) * PAGE_SIZE;

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      pinned: posts.pinned,
      views: posts.views,
      createdAt: posts.createdAt,
      authorName: users.name,
      commentCount: sql<number>`(select count(*) from ${comments} where ${comments.postId} = ${posts.id})`,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.boardId, boardId))
    .orderBy(desc(posts.pinned), desc(posts.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.boardId, boardId));

  return { rows, total: Number(count), page, pageSize: PAGE_SIZE };
}

/** 글 1개(작성자·게시판 포함). */
export async function getPostById(id: number) {
  const [row] = await db
    .select({
      id: posts.id,
      boardId: posts.boardId,
      boardSlug: boards.slug,
      boardName: boards.name,
      title: posts.title,
      content: posts.content,
      pinned: posts.pinned,
      views: posts.views,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorId: posts.authorId,
      authorName: users.name,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(boards, eq(posts.boardId, boards.id))
    .where(eq(posts.id, id))
    .limit(1);
  return row ?? null;
}

/** 조회수 +1 (상세 진입 시). */
export async function incrementPostViews(id: number) {
  await db
    .update(posts)
    .set({ views: sql`${posts.views} + 1` })
    .where(eq(posts.id, id));
}

/** 글의 댓글 목록(작성자 포함, 오래된 순). */
export async function getCommentsByPost(postId: number) {
  return db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: users.name,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);
}

/** 글의 첨부파일 목록. */
export async function getAttachmentsByPost(postId: number) {
  return db
    .select()
    .from(attachments)
    .where(eq(attachments.postId, postId))
    .orderBy(attachments.id);
}

/** 첨부파일 1개. */
export async function getAttachmentById(id: number) {
  const [row] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1);
  return row ?? null;
}

/** 사용자 알림 목록(최신순). */
export async function getNotifications(userId: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

/** 읽지 않은 알림 개수. */
export async function getUnreadNotificationCount(userId: number) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return Number(count);
}
