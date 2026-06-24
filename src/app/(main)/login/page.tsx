import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  // 이미 로그인된 경우 홈으로
  const user = await getCurrentUser();
  if (user) redirect(callbackUrl || "/");

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-foreground">로그인</h1>
        <p className="mb-6 text-sm text-muted">사내 계정으로 로그인하세요.</p>
        <LoginForm callbackUrl={callbackUrl || "/"} />
      </div>
    </div>
  );
}
