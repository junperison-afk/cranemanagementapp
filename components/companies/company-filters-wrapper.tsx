"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CompanyFilterButton, CompanyFilterPanel } from "./company-filters";

export function CompanyFilterButtonWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const activeFilterCount = [
    searchParams.get("industryType"),
    searchParams.get("billingFlag"),
    searchParams.get("hasSalesOpportunities"),
    searchParams.get("hasProjects"),
    searchParams.get("hasEquipment"),
    searchParams.get("updatedAfter"),
    searchParams.get("updatedBefore"),
  ].filter((v) => v).length;

  const toggleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isFilterOpen) {
      params.delete("filter");
    } else {
      params.set("filter", "open");
    }
    router.push(`/companies?${params.toString()}`);
  };

  return (
    <CompanyFilterButton
      onToggle={toggleFilter}
      activeFilterCount={activeFilterCount}
    />
  );
}

export function CompanyFilterPanelWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const closeFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filter");
    router.push(`/companies?${params.toString()}`);
  };

  return (
    <div
      className={`overflow-hidden flex-shrink-0 h-full transition-all duration-300 ease-in-out ${
        isFilterOpen ? "w-80" : "w-0"
      }`}
    >
      <div
        className={`h-full transition-transform duration-300 ease-in-out ${
          isFilterOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <CompanyFilterPanel isOpen={isFilterOpen} onClose={closeFilter} />
      </div>
    </div>
  );
}

