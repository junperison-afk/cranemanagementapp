"use client";

import { useRouter, useSearchParams } from "next/navigation";
import FilterButton from "@/components/common/filter-button";
import FilterPanelWrapper from "@/components/common/filter-panel-wrapper";
import { WorkRecordFilterPanel } from "./work-record-filters";

export function WorkRecordFilterButtonWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const activeFilterCount = [
    searchParams.get("equipmentId"),
    searchParams.get("userId"),
    searchParams.get("workType"),
    searchParams.get("overallJudgment"),
    searchParams.get("inspectionDateAfter"),
    searchParams.get("inspectionDateBefore"),
  ].filter((v) => v).length;

  const toggleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isFilterOpen) {
      params.delete("filter");
    } else {
      params.set("filter", "open");
    }
    router.push(`/work-records?${params.toString()}`);
  };

  return (
    <FilterButton
      onToggle={toggleFilter}
      activeFilterCount={activeFilterCount}
    />
  );
}

export function WorkRecordFilterPanelWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const closeFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filter");
    router.push(`/work-records?${params.toString()}`);
  };

  return (
    <FilterPanelWrapper isOpen={isFilterOpen}>
      <WorkRecordFilterPanel isOpen={isFilterOpen} onClose={closeFilter} />
    </FilterPanelWrapper>
  );
}

