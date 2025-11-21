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
        include: {
          items: {
            orderBy: {
              itemNumber: "asc",
            },
          },
        },
      },
      contracts: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            orderBy: {
              itemNumber: "asc",
            },
          },
        },
      },
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
          contracts: true,
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
      items: quote.items.map((item) => ({
        ...item,
        quantity: item.quantity?.toNumber() ?? null,
        unitPrice: item.unitPrice?.toNumber() ?? null,
        amount: item.amount.toNumber(),
      })),
    })),
    contracts: salesOpportunity.contracts.map((contract) => ({
      ...contract,
      amount: contract.amount.toNumber(),
      items: contract.items.map((item) => ({
        ...item,
        quantity: item.quantity?.toNumber() ?? null,
        unitPrice: item.unitPrice?.toNumber() ?? null,
        amount: item.amount.toNumber(),
      })),
    })),
    _count: salesOpportunity._count,
  };

  return (
    <ClientSalesOpportunityDetail
      salesOpportunity={salesOpportunityWithNumberAmount}
      canEdit={canEdit}
    />
  );
}

