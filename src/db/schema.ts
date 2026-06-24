import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── 권한 ──────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["admin", "member"]);

// ── 사용자 ────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // 사번 또는 사내 아이디
  username: varchar("username", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 256 }),
  department: varchar("department", { length: 128 }),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── 게시판(카테고리) ──────────────────────────────────
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(), // free, qna, notice ...
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  // true면 관리자만 글 작성 가능 (예: 공지)
  adminOnly: boolean("admin_only").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ── 게시글 ────────────────────────────────────────────
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    boardId: integer("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    views: integer("views").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("posts_board_idx").on(t.boardId),
    index("posts_created_idx").on(t.createdAt),
  ],
);

// ── 댓글 ──────────────────────────────────────────────
export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_post_idx").on(t.postId)],
);

// ── 첨부파일 ──────────────────────────────────────────
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  originalName: varchar("original_name", { length: 512 }).notNull(),
  storedName: varchar("stored_name", { length: 512 }).notNull(), // 디스크상 실제 파일명
  mimeType: varchar("mime_type", { length: 128 }).notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── 알림 ──────────────────────────────────────────────
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // 알림 본문 (예: "홍길동님이 회원님 글에 댓글을 남겼습니다")
    message: varchar("message", { length: 512 }).notNull(),
    link: varchar("link", { length: 512 }), // 클릭 시 이동 경로
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

// ── 채팅 메시지 ───────────────────────────────────────
// 전사 통합 채팅방 1개 (슬랙식 #general). 이력은 DB에 보존.
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_created_idx").on(t.createdAt)],
);

// ── 공동편집 스프레드시트 ─────────────────────────────
export const sheets = pgTable("sheets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  rows: integer("rows").notNull().default(100),
  cols: integer("cols").notNull().default(26),
  // 열 너비/행 높이 오버라이드. 기본값과 다른 것만 저장 { "0": 160, ... }(px)
  colWidths: jsonb("col_widths").$type<Record<string, number>>().notNull().default({}),
  rowHeights: jsonb("row_heights").$type<Record<string, number>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 셀 값. (sheetId, row, col)이 유일. 빈 셀은 행 없음.
export const sheetCells = pgTable(
  "sheet_cells",
  {
    id: serial("id").primaryKey(),
    sheetId: integer("sheet_id")
      .notNull()
      .references(() => sheets.id, { onDelete: "cascade" }),
    row: integer("row").notNull(),
    col: integer("col").notNull(),
    value: text("value").notNull().default(""),
    updatedBy: integer("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sheet_cell_unique").on(t.sheetId, t.row, t.col),
    index("sheet_cell_sheet_idx").on(t.sheetId),
  ],
);

// ── 관계 정의 ─────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  notifications: many(notifications),
}));

export const boardsRelations = relations(boards, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  board: one(boards, { fields: [posts.boardId], references: [boards.id] }),
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
  attachments: many(attachments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  post: one(posts, { fields: [attachments.postId], references: [posts.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
