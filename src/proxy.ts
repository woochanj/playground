import NextAuth from "next-auth";

// Edge(proxy) 런타임에서는 DB·bcrypt를 쓰는 provider를 불러오면 안 되므로
// provider 없이 가벼운 설정만으로 세션 쿠키를 갱신한다. 실제 접근 제어는
// 각 서버 컴포넌트/액션에서 auth()로 수행한다(@/lib/session).
const { auth } = NextAuth({
  providers: [],
  session: { strategy: "jwt" },
});

export default auth;

export const config = {
  // 정적 자산·이미지 최적화·favicon 등은 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
