"use client";

import EquipmentTableWrapper from "@/components/equipment/equipment-table-wrapper";

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

interface EquipmentPageClientProps {
  equipment: Equipment[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function EquipmentPageClient({
  equipment,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: EquipmentPageClientProps) {
  return (
    <EquipmentTableWrapper
      equipment={equipment}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
    />
  );
}

