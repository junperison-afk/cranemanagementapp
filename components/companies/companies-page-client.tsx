"use client";

import {
  CompanyFilterButtonWrapper,
  CompanyFilterPanelWrapper,
} from "@/components/companies/company-filters-wrapper";
import CompanyTableWrapper from "@/components/companies/company-table-wrapper";
import CreateButton from "@/components/common/create-button";
import CompanyCreateForm from "@/components/companies/company-create-form";
import DeleteButton from "@/components/common/delete-button";

interface Company {
  id: string;
  name: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  updatedAt: Date;
  _count: {
    salesOpportunities: number;
    equipment: number;
    projects: number;
  };
}

interface CompaniesPageClientProps {
  companies: Company[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function CompaniesPageClient({
  companies,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: CompaniesPageClientProps) {
  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">取引先一覧</h1>
          <p className="mt-1 text-sm text-gray-500">
            取引先の検索・管理ができます
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DeleteButton
            eventName="companySelectionChange"
            apiPath="/api/companies"
            resourceName="取引先"
          />
          <CompanyFilterButtonWrapper />
          <CreateButton
            title="取引先を新規作成"
            formComponent={CompanyCreateForm}
            resourcePath="companies"
          />
        </div>
      </div>

      {/* データテーブル部分（2分割可能） */}
      <div className="flex-1 flex gap-0 min-h-0 h-full">
        {/* フィルターパネル */}
        <div>
          <CompanyFilterPanelWrapper />
        </div>

        {/* データテーブル */}
        <div className="flex-1 min-w-0">
          <CompanyTableWrapper
            companies={companies}
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

