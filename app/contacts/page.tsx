import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import { prisma } from "@/lib/prisma";
import {
  ContactFilterButtonWrapper,
  ContactFilterPanelWrapper,
} from "@/components/contacts/contact-filters-wrapper";
import ContactTable from "@/components/contacts/contact-table";
import CreateButton from "@/components/common/create-button";
import ContactCreateForm from "@/components/contacts/contact-create-form";

// 常に最新のデータを取得するため、動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    companyId?: string;
  };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const search = searchParams.search || "";
  const page = parseInt(searchParams.page || "1");
  const limit = parseInt(searchParams.limit || "20");
  const skip = (page - 1) * limit;

  // フィルター条件の構築
  const whereConditions: any[] = [];

  // 検索条件
  if (search) {
    whereConditions.push({
      OR: [
        { name: { contains: search } },
        { position: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { notes: { contains: search } },
        { company: { name: { contains: search } } },
      ],
    });
  }

  // 取引先フィルター
  if (searchParams.companyId) {
    whereConditions.push({
      companyId: searchParams.companyId,
    });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [contacts, total] = await Promise.all([
    prisma.companyContact.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.companyContact.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between flex-shrink-0 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">連絡先一覧</h1>
            <p className="mt-1 text-sm text-gray-500">
              連絡先の検索・管理ができます
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ContactFilterButtonWrapper />
            <CreateButton
              title="連絡先を新規作成"
              formComponent={ContactCreateForm}
              resourcePath="contacts"
            />
          </div>
        </div>

        {/* データテーブル部分（2分割可能） */}
        <div className="flex-1 flex gap-0 min-h-0 h-full">
          {/* フィルターパネル */}
          <div className="mr-6">
            <ContactFilterPanelWrapper />
          </div>

          {/* データテーブル */}
          <div className="flex-1 min-w-0">
            <ContactTable
              contacts={contacts}
              total={total}
              page={page}
              limit={limit}
              skip={skip}
              totalPages={totalPages}
              searchParams={searchParams}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

