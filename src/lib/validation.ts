import { z } from "zod";

export const postSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요").max(300, "제목이 너무 깁니다"),
  content: z.string().trim().min(1, "내용을 입력하세요"),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, "댓글 내용을 입력하세요").max(2000, "댓글이 너무 깁니다"),
});

export const newMemberSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "아이디는 2자 이상이어야 합니다")
    .max(64, "아이디가 너무 깁니다")
    .regex(/^[a-zA-Z0-9._-]+$/, "아이디는 영문/숫자/._- 만 사용할 수 있습니다"),
  name: z.string().trim().min(1, "이름을 입력하세요").max(128, "이름이 너무 깁니다"),
  department: z.string().trim().max(128, "부서명이 너무 깁니다").optional(),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다").max(128),
  role: z.enum(["admin", "member"]),
});

export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type NewMemberInput = z.infer<typeof newMemberSchema>;
