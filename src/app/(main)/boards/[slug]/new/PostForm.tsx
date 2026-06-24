"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createPost, updatePost, type PostFormState } from "@/app/actions/post";

type Props =
  | {
      mode: "create";
      boardId: number;
      cancelHref: string;
    }
  | {
      mode: "edit";
      postId: number;
      cancelHref: string;
      initial: { title: string; content: string };
    };

export default function PostForm(props: Props) {
  const action = props.mode === "create" ? createPost : updatePost;
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {props.mode === "create" ? (
        <input type="hidden" name="boardId" value={props.boardId} />
      ) : (
        <input type="hidden" name="postId" value={props.postId} />
      )}

      <input
        name="title"
        type="text"
        required
        placeholder="제목"
        defaultValue={props.mode === "edit" ? props.initial.title : ""}
        className="toss-input text-lg font-semibold"
      />

      <textarea
        name="content"
        required
        rows={14}
        placeholder="내용을 입력하세요"
        defaultValue={props.mode === "edit" ? props.initial.content : ""}
        className="toss-input resize-y leading-relaxed"
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-body">
          파일 첨부 {props.mode === "edit" && "(추가 업로드)"}
        </label>
        <input
          name="files"
          type="file"
          multiple
          className="block w-full text-sm text-body file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary-soft/70"
        />
        <p className="mt-1 text-xs text-muted">
          파일당 최대 20MB. 실행 파일은 업로드할 수 없습니다.
        </p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-up-soft px-4 py-2.5 text-sm text-up">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Link
          href={props.cancelHref}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-body transition-colors hover:bg-hover"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending
            ? "저장 중…"
            : props.mode === "create"
              ? "등록"
              : "수정 완료"}
        </button>
      </div>
    </form>
  );
}
