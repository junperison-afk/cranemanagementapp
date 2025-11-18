"use client";

import { useSearchParams } from "next/navigation";
import EquipmentTable from "./equipment-table";

interface Equipment {
  id: string;
  name: string;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    title: string;
  } | null;
  _count: {
    inspectionRecords: number;
  };
}

interface EquipmentTableWrapperProps {
  equipment: Equipment[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function EquipmentTableWrapper({
  equipment,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: EquipmentTableWrapperProps) {
  const searchParamsHook = useSearchParams();
  const isFilterOpen = searchParamsHook.get("filter") === "open";

  return (
    <div className="flex-1 min-w-0">
      <EquipmentTable
        equipment={equipment}
        total={total}
        page={page}
        limit={limit}
        skip={skip}
        totalPages={totalPages}
        searchParams={searchParams}
      />
    </div>
  );
}

