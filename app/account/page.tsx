import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import AccountContent from "@/components/account/account-content";

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <MainLayout>
      <AccountContent initialUser={session.user} />
    </MainLayout>
  );
}

