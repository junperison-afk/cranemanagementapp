"use client";

import { useRouter, useSearchParams } from "next/navigation";
import FilterButton from "@/components/common/filter-button";
import FilterPanelWrapper from "@/components/common/filter-panel-wrapper";
import { SalesOpportunityFilterPanel } from "./sales-opportunity-filters";

export function SalesOpportunityFilterButtonWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const activeFilterCount = [
    searchParams.get("search"),
    searchParams.get("status"),
    searchParams.get("companyId"),
    searchParams.get("estimatedAmount"),
    searchParams.get("craneCount"),
    searchParams.get("estimateCount"),
    searchParams.get("occurredAfter"),
    searchParams.get("occurredBefore"),
  ].filter((v) => v).length;

  const toggleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isFilterOpen) {
      params.delete("filter");
    } else {
      params.set("filter", "open");
    }
    router.push(`/sales-opportunities?${params.toString()}`);
  };

  return (
    <FilterButton
      onToggle={toggleFilter}
      activeFilterCount={activeFilterCount}
    />
  );
}

export function SalesOpportunityFilterPanelWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const closeFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filter");
    router.push(`/sales-opportunities?${params.toString()}`);
  };

  return (
    <FilterPanelWrapper isOpen={isFilterOpen}>
      <SalesOpportunityFilterPanel isOpen={isFilterOpen} onClose={closeFilter} />
    </FilterPanelWrapper>
  );
}

