import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

/**
 * サーバーサイドでセッションを取得
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * 認証が必要なページで使用
 * 未認証の場合はログインページにリダイレクト
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * 管理者権限が必要なページで使用
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}

/**
 * 編集者以上の権限が必要なページで使用
 */
export async function requireEditor() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
    redirect("/");
  }
  return session;
}

