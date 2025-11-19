"use client";

import WorkRecordTable from "./work-record-table";
import { useSelectionEvent } from "@/hooks/use-selection-event";

interface WorkRecord {
  id: string;
  workType: "INSPECTION" | "REPAIR" | "MAINTENANCE" | "OTHER";
  inspectionDate: Date;
  overallJudgment: "GOOD" | "CAUTION" | "BAD" | "REPAIR" | null;
  findings: string | null;
  summary: string | null;
  updatedAt: Date;
  equipment: {
    id: string;
    name: string;
    model: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface WorkRecordTableWrapperProps {
  workRecords: WorkRecord[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function WorkRecordTableWrapper({
  workRecords,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: WorkRecordTableWrapperProps) {
  const handleSelectionChange = useSelectionEvent("workRecordSelectionChange");

  return (
    <WorkRecordTable
      workRecords={workRecords}
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

