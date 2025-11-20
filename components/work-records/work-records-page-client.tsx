"use client";

import WorkRecordTableWrapper from "@/components/work-records/work-record-table-wrapper";

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

interface WorkRecordsPageClientProps {
  workRecords: WorkRecord[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function WorkRecordsPageClient({
  workRecords,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: WorkRecordsPageClientProps) {
  return (
    <WorkRecordTableWrapper
      workRecords={workRecords}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
    />
  );
}

