"use client";

import SalesOpportunityTable from "./sales-opportunity-table";
import { useSelectionEvent } from "@/hooks/use-selection-event";

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

interface SalesOpportunityTableWrapperProps {
  salesOpportunities: SalesOpportunity[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function SalesOpportunityTableWrapper({
  salesOpportunities,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: SalesOpportunityTableWrapperProps) {
  const handleSelectionChange = useSelectionEvent("salesOpportunitySelectionChange");

  return (
    <SalesOpportunityTable
      salesOpportunities={salesOpportunities}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
      onSelectionChange={handleSelectionChange}
    />
  );
}

