export default function FullLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 전체 폭 사용 (시트 등 넓은 화면용)
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
  );
}
