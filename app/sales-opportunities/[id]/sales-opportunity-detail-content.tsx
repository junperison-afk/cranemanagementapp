import { prisma } from "@/lib/prisma";
import ClientSalesOpportunityDetail from "./client-sales-opportunity-detail";

interface SalesOpportunityDetailContentProps {
  id: string;
  canEdit: boolean;
}

export default async function SalesOpportunityDetailContent({
  id,
  canEdit,
}: SalesOpportunityDetailContentProps) {
  const salesOpportunity = await prisma.salesOpportunity.findUnique({
    where: { id },
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
      quotes: {
        orderBy: {
          createdAt: "desc",
        },
      },
      contract: true,
      project: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      _count: {
        select: {
          quotes: true,
        },
      },
    },
  });

  if (!salesOpportunity) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">営業案件が見つかりません</p>
      </div>
    );
  }

  // Decimal型をnumber型に変換
  const salesOpportunityWithNumberAmount = {
    ...salesOpportunity,
    estimatedAmount: salesOpportunity.estimatedAmount
      ? salesOpportunity.estimatedAmount.toNumber()
      : null,
    quotes: salesOpportunity.quotes.map((quote) => ({
      ...quote,
      amount: quote.amount.toNumber(),
    })),
  };

  return (
    <ClientSalesOpportunityDetail
      salesOpportunity={salesOpportunityWithNumberAmount}
      canEdit={canEdit}
    />
  );
}

