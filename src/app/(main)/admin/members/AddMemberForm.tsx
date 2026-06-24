"use client";

import { useActionState, useEffect, useRef } from "react";
import { createMember, type MemberFormState } from "@/app/actions/member";

export default function AddMemberForm() {
  const [state, action, pending] = useActionState<MemberFormState, FormData>(
    createMember,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={action}
      className="toss-card p-5"
    >
      <h2 className="mb-4 text-base font-bold text-foreground">회원 추가</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-body">아이디 *</span>
          <input
            name="username"
            required
            placeholder="사번 또는 사내 아이디"
            className="toss-input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-body">이름 *</span>
          <input
            name="name"
            required
            placeholder="홍길동"
            className="toss-input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-body">부서</span>
          <input
            name="department"
            placeholder="개발팀"
            className="toss-input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-body">초기 비밀번호 *</span>
          <input
            name="password"
            type="text"
            required
            placeholder="4자 이상"
            className="toss-input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-body">권한</span>
          <select
            name="role"
            defaultValue="member"
            className="toss-input"
          >
            <option value="member">일반회원</option>
            <option value="admin">관리자</option>
          </select>
        </label>
      </div>

      {state.error && (
        <p className="mt-3 rounded-lg bg-up-soft px-3 py-2 text-sm text-up">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-3 rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">
          {state.ok}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "추가 중…" : "회원 추가"}
        </button>
      </div>
    </form>
  );
}
