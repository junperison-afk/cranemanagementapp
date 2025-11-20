import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import SettingsPageClient from "@/components/settings/settings-page-client";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // 編集者以上の権限が必要
  if (session.user.role === "VIEWER") {
    redirect("/");
  }

  return (
    <MainLayout>
      <SettingsPageClient />
    </MainLayout>
  );
}

