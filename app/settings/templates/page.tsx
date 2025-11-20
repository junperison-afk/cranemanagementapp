import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import TemplatesPageClient from "@/components/settings/templates-page-client";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
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
      <TemplatesPageClient />
    </MainLayout>
  );
}

