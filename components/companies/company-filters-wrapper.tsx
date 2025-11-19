"use client";

import { useRouter, useSearchParams } from "next/navigation";
import FilterButton from "@/components/common/filter-button";
import FilterPanelWrapper from "@/components/common/filter-panel-wrapper";
import { CompanyFilterPanel } from "./company-filters";

export function CompanyFilterButtonWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const activeFilterCount = [
    searchParams.get("search"),
    searchParams.get("postalCode"),
    searchParams.get("address"),
    searchParams.get("phone"),
    searchParams.get("email"),
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
    <FilterButton
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
    <FilterPanelWrapper isOpen={isFilterOpen}>
      <CompanyFilterPanel isOpen={isFilterOpen} onClose={closeFilter} />
    </FilterPanelWrapper>
  );
}

