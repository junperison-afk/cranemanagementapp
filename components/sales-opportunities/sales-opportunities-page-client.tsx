"use client";

import SalesOpportunityTableWrapper from "@/components/sales-opportunities/sales-opportunity-table-wrapper";

interface SalesOpportunity {
  id: string;
  title: string;
  status: "ESTIMATING" | "WON" | "LOST";
  estimatedAmount: number | null;
  craneCount: number | null;
  craneInfo: string | null;
  occurredAt: Date | null;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
  _count: {
    quotes: number;
  };
}

interface SalesOpportunitiesPageClientProps {
  salesOpportunities: SalesOpportunity[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function SalesOpportunitiesPageClient({
  salesOpportunities,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: SalesOpportunitiesPageClientProps) {
  return (
    <SalesOpportunityTableWrapper
      salesOpportunities={salesOpportunities}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
    />
  );
}

