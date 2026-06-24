import { requireAdmin } from "@/lib/session";
import { getMembers } from "@/lib/queries";
import AddMemberForm from "./AddMemberForm";
import MemberRow from "./MemberRow";

export default async function MembersAdminPage() {
  const me = await requireAdmin();
  const members = await getMembers();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          회원 관리
        </h1>
        <p className="mt-1 text-[15px] text-body">
          관리자만 회원을 추가하고 권한을 관리할 수 있어요. (총 {members.length}명)
        </p>
      </header>

      <AddMemberForm />

      <div className="overflow-hidden toss-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-fill text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">이름 / 아이디</th>
              <th className="px-4 py-2.5 text-left font-semibold">부서</th>
              <th className="px-4 py-2.5 text-left font-semibold">권한</th>
              <th className="px-4 py-2.5 text-left font-semibold">활동</th>
              <th className="px-4 py-2.5 text-left font-semibold">가입일</th>
              <th className="px-4 py-2.5 text-right font-semibold">관리</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRow key={m.id} m={m} isSelf={m.id === Number(me.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
