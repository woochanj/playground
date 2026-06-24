import { z } from "zod";

export const postSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요").max(300, "제목이 너무 깁니다"),
  content: z.string().trim().min(1, "내용을 입력하세요"),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, "댓글 내용을 입력하세요").max(2000, "댓글이 너무 깁니다"),
});

export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
