import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClientContactDetail from "./client-contact-detail";

export default async function ContactDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const contact = await prisma.companyContact.findUnique({
    where: { id: params.id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          postalCode: true,
          address: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!contact) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">連絡先が見つかりません</p>
          <Link
            href="/contacts"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            一覧に戻る
          </Link>
        </div>
      </MainLayout>
    );
  }

  const canEdit =
    session.user.role === "ADMIN" || session.user.role === "EDITOR";

  return (
    <MainLayout>
      <ClientContactDetail contact={contact} canEdit={canEdit} />
    </MainLayout>
  );
}

