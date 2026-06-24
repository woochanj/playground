"use client";

import { useActionState, useEffect, useRef } from "react";
import { createComment, type CommentFormState } from "@/app/actions/comment";

export default function CommentForm({ postId }: { postId: number }) {
  const [state, action, pending] = useActionState<CommentFormState, FormData>(
    createComment,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // 성공(에러 없음)하면 입력창 초기화
  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
    }
  }, [state, pending]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="content"
        required
        rows={3}
        placeholder="댓글을 입력하세요"
        className="toss-input resize-y text-sm"
      />
      {state.error && (
        <p className="text-sm text-up">{state.error}</p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "등록 중…" : "댓글 등록"}
        </button>
      </div>
    </form>
  );
}
