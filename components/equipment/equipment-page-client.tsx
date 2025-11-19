"use client";

import {
  EquipmentFilterButtonWrapper,
  EquipmentFilterPanelWrapper,
} from "@/components/equipment/equipment-filters-wrapper";
import EquipmentTableWrapper from "@/components/equipment/equipment-table-wrapper";
import CreateButton from "@/components/common/create-button";
import EquipmentCreateForm from "@/components/equipment/equipment-create-form";
import DeleteButton from "@/components/common/delete-button";

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
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">機器一覧</h1>
          <p className="mt-1 text-sm text-gray-500">
            機器の検索・管理ができます
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DeleteButton
            eventName="equipmentSelectionChange"
            apiPath="/api/equipment"
            resourceName="機器"
          />
          <EquipmentFilterButtonWrapper />
          <CreateButton
            title="機器を新規作成"
            formComponent={EquipmentCreateForm}
            resourcePath="equipment"
          />
        </div>
      </div>

      {/* データテーブル部分（2分割可能） */}
      <div className="flex-1 flex gap-0 min-h-0 h-full">
        {/* フィルターパネル */}
        <div>
          <EquipmentFilterPanelWrapper />
        </div>

        {/* データテーブル */}
        <div className="flex-1 min-w-0">
          <EquipmentTableWrapper
            equipment={equipment}
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

