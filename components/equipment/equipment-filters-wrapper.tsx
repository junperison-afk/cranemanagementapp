"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EquipmentFilterButton, EquipmentFilterPanel } from "./equipment-filters";

export function EquipmentFilterButtonWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const activeFilterCount = [
    searchParams.get("companyId"),
    searchParams.get("projectId"),
  ].filter((v) => v).length;

  const toggleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (isFilterOpen) {
      params.delete("filter");
    } else {
      params.set("filter", "open");
    }
    router.push(`/equipment?${params.toString()}`);
  };

  return (
    <EquipmentFilterButton
      onToggle={toggleFilter}
      activeFilterCount={activeFilterCount}
    />
  );
}

export function EquipmentFilterPanelWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFilterOpen = searchParams.get("filter") === "open";

  const closeFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filter");
    router.push(`/equipment?${params.toString()}`);
  };

  if (!isFilterOpen) return null;

  return <EquipmentFilterPanel isOpen={isFilterOpen} onClose={closeFilter} />;
}

