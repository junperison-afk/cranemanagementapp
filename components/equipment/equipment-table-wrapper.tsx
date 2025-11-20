"use client";

import { useEffect } from "react";
import EquipmentTable from "./equipment-table";
import { useSelectionEvent } from "@/hooks/use-selection-event";

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
  const handleSelectionChange = useSelectionEvent("equipmentSelectionChange");

  // データテーブルが読み込まれたことを通知
  useEffect(() => {
    // 次のフレームで実行して、DOMの更新を待つ
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("page:content:loaded"));
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [equipment, total, page, limit, skip, totalPages]);

  return (
    <EquipmentTable
      equipment={equipment}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
      onSelectionChange={handleSelectionChange}
    />
  );
}
