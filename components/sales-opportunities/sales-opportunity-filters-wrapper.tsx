"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  SalesOpportunityFilterButton,
  SalesOpportunityFilterPanel,
} from "./sales-opportunity-filters";

export function SalesOpportunityFilterButtonWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const activeFilterCount = [
    searchParams.get("status"),
    searchParams.get("companyId"),
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
    <SalesOpportunityFilterButton
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
        <SalesOpportunityFilterPanel isOpen={isFilterOpen} onClose={closeFilter} />
      </div>
    </div>
  );
}

