"use client";

import {
  WorkRecordFilterButtonWrapper,
  WorkRecordFilterPanelWrapper,
} from "@/components/work-records/work-record-filters-wrapper";
import WorkRecordTableWrapper from "@/components/work-records/work-record-table-wrapper";
import CreateButton from "@/components/common/create-button";
import WorkRecordCreateForm from "@/components/work-records/work-record-create-form";
import DeleteButton from "@/components/common/delete-button";

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
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">作業記録一覧</h1>
          <p className="mt-1 text-sm text-gray-500">
            作業記録の検索・管理ができます
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DeleteButton
            eventName="workRecordSelectionChange"
            apiPath="/api/work-records"
            resourceName="作業記録"
          />
          <WorkRecordFilterButtonWrapper />
          <CreateButton
            title="作業記録を新規作成"
            formComponent={WorkRecordCreateForm}
            resourcePath="work-records"
          />
        </div>
      </div>

      {/* データテーブル部分（2分割可能） */}
      <div className="flex-1 flex gap-0 min-h-0 h-full">
        {/* フィルターパネル */}
        <div>
          <WorkRecordFilterPanelWrapper />
        </div>

        {/* データテーブル */}
        <div className="flex-1 min-w-0">
          <WorkRecordTableWrapper
            workRecords={workRecords}
            total={total}
            page={page}
            limit={limit}
            skip={skip}
            totalPages={totalPages}
            searchParams={searchParams}
          />
        </div>
      </div>
    </div>
  );
}

