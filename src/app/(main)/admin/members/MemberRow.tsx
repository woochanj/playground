"use client";

import {
  updateMemberRole,
  resetMemberPassword,
  deleteMember,
} from "@/app/actions/member";
import { formatDateTime } from "@/lib/format";

type Member = {
  id: number;
  username: string;
  name: string;
  department: string | null;
  role: "admin" | "member";
  createdAt: Date;
  postCount: number;
  commentCount: number;
};

export default function MemberRow({
  m,
  isSelf,
}: {
  m: Member;
  isSelf: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3">
        <div className="font-semibold text-foreground">
          {m.name}
          {isSelf && <span className="ml-1 text-xs text-primary">나</span>}
        </div>
        <div className="text-xs text-muted">@{m.username}</div>
      </td>
      <td className="px-4 py-3 text-sm text-body">{m.department || "-"}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            m.role === "admin"
              ? "bg-primary-soft text-primary"
              : "bg-fill text-body"
          }`}
        >
          {m.role === "admin" ? "관리자" : "일반회원"}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted">
        글 {Number(m.postCount)} · 댓글 {Number(m.commentCount)}
      </td>
      <td className="px-4 py-3 text-xs text-muted">{formatDateTime(m.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {/* 권한 토글 (본인 제외) */}
          {!isSelf && (
            <form action={updateMemberRole}>
              <input type="hidden" name="id" value={m.id} />
              <input
                type="hidden"
                name="role"
                value={m.role === "admin" ? "member" : "admin"}
              />
              <button
                type="submit"
                className="rounded-lg bg-fill px-2.5 py-1.5 text-xs font-semibold text-body transition-colors hover:bg-fill-hover"
              >
                {m.role === "admin" ? "일반회원으로" : "관리자로"}
              </button>
            </form>
          )}

          {/* 비밀번호 초기화 */}
          <form
            action={resetMemberPassword}
            onSubmit={(e) => {
              const pw = prompt(`${m.name}님의 새 비밀번호를 입력하세요 (4자 이상)`);
              if (!pw || pw.trim().length < 4) {
                e.preventDefault();
                return;
              }
              (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value =
                pw.trim();
            }}
          >
            <input type="hidden" name="id" value={m.id} />
            <input type="hidden" name="password" value="" />
            <button
              type="submit"
              className="rounded-lg bg-fill px-2.5 py-1.5 text-xs font-semibold text-body transition-colors hover:bg-fill-hover"
            >
              비번 초기화
            </button>
          </form>

          {/* 삭제 (본인 제외) */}
          {!isSelf && (
            <form
              action={deleteMember}
              onSubmit={(e) => {
                const msg =
                  Number(m.postCount) + Number(m.commentCount) > 0
                    ? `${m.name}님을 삭제하면 작성한 글 ${m.postCount}개·댓글 ${m.commentCount}개도 함께 삭제됩니다. 계속할까요?`
                    : `${m.name}님을 삭제할까요?`;
                if (!confirm(msg)) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={m.id} />
              <button
                type="submit"
                className="rounded-lg bg-fill px-2.5 py-1.5 text-xs font-semibold text-up transition-colors hover:bg-up-soft"
              >
                삭제
              </button>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}
