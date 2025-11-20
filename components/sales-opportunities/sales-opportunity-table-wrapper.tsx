"use client";

import { useEffect } from "react";
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

  // データテーブルが読み込まれたことを通知
  useEffect(() => {
    // 次のフレームで実行して、DOMの更新を待つ
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("page:content:loaded"));
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [salesOpportunities, total, page, limit, skip, totalPages]);

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

