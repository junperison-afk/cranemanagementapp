import { prisma } from "@/lib/prisma";
import ContactsPageClient from "./contacts-page-client";

interface ContactsPageContentProps {
  searchParams: {
    search?: string;
    page?: string;
    limit?: string;
    companyId?: string;
    position?: string;
    phone?: string;
    email?: string;
    updatedAfter?: string;
    updatedBefore?: string;
  };
}

export default async function ContactsPageContent({
  searchParams,
}: ContactsPageContentProps) {
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

  // 役職フィルター
  if (searchParams.position) {
    whereConditions.push({
      position: { contains: searchParams.position },
    });
  }

  // 電話番号フィルター
  if (searchParams.phone) {
    whereConditions.push({
      phone: { contains: searchParams.phone },
    });
  }

  // メールフィルター
  if (searchParams.email) {
    whereConditions.push({
      email: { contains: searchParams.email },
    });
  }

  // 更新日時フィルター
  if (searchParams.updatedAfter) {
    whereConditions.push({
      updatedAt: { gte: new Date(searchParams.updatedAfter) },
    });
  }

  if (searchParams.updatedBefore) {
    whereConditions.push({
      updatedAt: { lte: new Date(searchParams.updatedBefore) },
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
    <ContactsPageClient
      contacts={contacts}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
    />
  );
}

