"use client";

import CompanyTableWrapper from "@/components/companies/company-table-wrapper";

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
    <CompanyTableWrapper
      companies={companies}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
    />
  );
}

