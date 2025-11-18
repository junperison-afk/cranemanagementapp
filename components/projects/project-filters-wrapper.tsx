"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ProjectFilterButton, ProjectFilterPanel } from "./project-filters";

export function ProjectFilterButtonWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const activeFilterCount = [
    searchParams.get("status"),
    searchParams.get("companyId"),
    searchParams.get("assignedUserId"),
    searchParams.get("startDateAfter"),
    searchParams.get("startDateBefore"),
    searchParams.get("endDateAfter"),
    searchParams.get("endDateBefore"),
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
    <ProjectFilterButton
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
        <ProjectFilterPanel isOpen={isFilterOpen} onClose={closeFilter} />
      </div>
    </div>
  );
}

