"use client";

import CompanyTable from "./company-table";
import { useSelectionEvent } from "@/hooks/use-selection-event";

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

interface CompanyTableWrapperProps {
  companies: Company[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function CompanyTableWrapper({
  companies,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: CompanyTableWrapperProps) {
  const handleSelectionChange = useSelectionEvent("companySelectionChange");

  return (
    <CompanyTable
      companies={companies}
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

