import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // 管理者専用ページのチェックなど、追加の認証ロジックをここに記述
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // ログインページは認証不要
        if (req.nextUrl.pathname === "/login") {
          return true;
        }
        // その他のページは認証が必要
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * 以下のパスを除くすべてのリクエストパスにマッチ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

