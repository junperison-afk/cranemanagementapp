"use client";

import { useRouter, useSearchParams } from "next/navigation";
import FilterButton from "@/components/common/filter-button";
import FilterPanelWrapper from "@/components/common/filter-panel-wrapper";
import { ProjectFilterPanel } from "./project-filters";

export function ProjectFilterButtonWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const activeFilterCount = [
    searchParams.get("search"),
    searchParams.get("status"),
    searchParams.get("companyId"),
    searchParams.get("assignedUserId"),
    searchParams.get("amount"),
    searchParams.get("equipmentCount"),
    searchParams.get("startDateAfter"),
    searchParams.get("startDateBefore"),
    searchParams.get("endDateAfter"),
    searchParams.get("endDateBefore"),
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
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <FilterButton
      onToggle={toggleFilter}
      activeFilterCount={activeFilterCount}
    />
  );
}

export function ProjectFilterPanelWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const closeFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filter");
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <FilterPanelWrapper isOpen={isFilterOpen}>
      <ProjectFilterPanel isOpen={isFilterOpen} onClose={closeFilter} />
    </FilterPanelWrapper>
  );
}

