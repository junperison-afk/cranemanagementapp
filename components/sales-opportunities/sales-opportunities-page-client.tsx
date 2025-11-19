"use client";

import {
  SalesOpportunityFilterButtonWrapper,
  SalesOpportunityFilterPanelWrapper,
} from "@/components/sales-opportunities/sales-opportunity-filters-wrapper";
import SalesOpportunityTableWrapper from "@/components/sales-opportunities/sales-opportunity-table-wrapper";
import CreateButton from "@/components/common/create-button";
import SalesOpportunityCreateForm from "@/components/sales-opportunities/sales-opportunity-create-form";
import DeleteButton from "@/components/common/delete-button";

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
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">営業案件一覧</h1>
          <p className="mt-1 text-sm text-gray-500">
            営業案件の検索・管理ができます
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DeleteButton
            eventName="salesOpportunitySelectionChange"
            apiPath="/api/sales-opportunities"
            resourceName="営業案件"
          />
          <SalesOpportunityFilterButtonWrapper />
          <CreateButton
            title="営業案件を新規作成"
            formComponent={SalesOpportunityCreateForm}
            resourcePath="sales-opportunities"
          />
        </div>
      </div>

      {/* データテーブル部分（2分割可能） */}
      <div className="flex-1 flex gap-0 min-h-0 h-full">
        {/* フィルターパネル */}
        <div>
          <SalesOpportunityFilterPanelWrapper />
        </div>

        {/* データテーブル */}
        <div className="flex-1 min-w-0">
          <SalesOpportunityTableWrapper
            salesOpportunities={salesOpportunities}
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
  );
}

