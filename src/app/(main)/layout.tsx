export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // 토스식: 회색 바탕 위 가운데 정렬된 콘텐츠(최대폭 제한)
  return (
    <main className="mx-auto w-full max-w-[760px] flex-1 px-6 py-8">
      {children}
    </main>
  );
}
