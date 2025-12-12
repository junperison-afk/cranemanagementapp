"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import DeleteItemButton from "@/components/common/delete-item-button";
import InlineEditField from "@/components/companies/inline-edit-field";
import InlineEditSelect from "@/components/companies/inline-edit-select";
import ProjectDetailModal from "@/components/companies/project-detail-modal";
import EquipmentDetailModal from "@/components/projects/equipment-detail-modal";
import EquipmentSelectModal from "@/components/projects/equipment-select-modal";
import ProjectSelectModal from "@/components/companies/project-select-modal";
import HistoryTab from "@/components/common/history-tab";

// 判定記号の定義
const JUDGMENT_SYMBOLS = [
  { value: "V", label: "V（良）" },
  { value: "△", label: "△（修理要）" },
  { value: "×", label: "×（特急修理要）" },
  { value: "H", label: "H（手直し済）" },
  { value: "P", label: "P（部品取替済）" },
  { value: "A", label: "A（調整済）" },
  { value: "T", label: "T（増締済）" },
  { value: "O", label: "O（給油脂済）" },
  { value: "S", label: "S（清掃済）" },
  { value: "K", label: "K（経過観察要）" },
] as const;

// 処置不良内容の選択肢
const DEFECT_OPTIONS = [
  { value: "01", label: "01. 摩耗" },
  { value: "02", label: "02. 変形" },
  { value: "03", label: "03. 破損" },
  { value: "04", label: "04. 亀裂" },
  { value: "05", label: "05. 傷" },
  { value: "06", label: "06. 異音" },
  { value: "07", label: "07. 焼損" },
  { value: "08", label: "08. 断線" },
  { value: "09", label: "09. 劣化" },
  { value: "10", label: "10. 弛み" },
  { value: "11", label: "11. 脱落" },
  { value: "12", label: "12. 汚損" },
  { value: "13", label: "13. 錆" },
  { value: "14", label: "14. 素線切れ" },
  { value: "15", label: "15. キンク" },
  { value: "16", label: "16. 陥没" },
  { value: "17", label: "17. 腐食" },
  { value: "18", label: "18. その他" },
] as const;

// 点検項目の定義（3階層構造）
const INSPECTION_ITEMS = [
  {
    id: "hoisting",
    title: "巻上部",
    categories: [
      {
        id: "brake",
        title: "ブレーキ",
        items: [
          { id: "lining_wear", label: "ライニング摩耗の有無" },
          { id: "slip", label: "スリップ状況" },
          { id: "solenoid_shoe_pin", label: "ソレノイド・シュー・ピン 摩耗作動の有無" },
        ],
      },
      {
        id: "limit_switch",
        title: "リミットスイッチ",
        items: [
          { id: "limit_lever_gap", label: "リミットレバー・ギャップ作動の有無" },
          { id: "contact_wear_limit", label: "接点摩耗の有無" },
        ],
      },
      {
        id: "frame",
        title: "フレーム",
        items: [
          { id: "crack_deform", label: "亀裂・変形の有無" },
        ],
      },
      {
        id: "wire_rope",
        title: "ワイヤロープ（チェン）",
        items: [
          { id: "wear", label: "摩耗の有無" },
          { id: "wire_break", label: "素線切断の有無" },
          { id: "rope_end_equalizer", label: "ロープエンド・エコライザー異常の有無" },
        ],
      },
      {
        id: "load_block",
        title: "ロードブロック",
        items: [
          { id: "hook_retainer_deform", label: "フック外れ止め金具変形の有無" },
          { id: "sheave_pin_wear", label: "シーブ・ピン摩耗破損の有無" },
          { id: "hook_wear", label: "フック摩耗・疵の有無" },
        ],
      },
    ],
  },
  {
    id: "lateral",
    title: "横行部",
    categories: [
      {
        id: "trolley",
        title: "トロリー",
        items: [
          { id: "wheel_guide_roller_wear", label: "ホイル･ガイドローラー摩耗の有無" },
          { id: "lateral_motor_reducer", label: "横行電動・減速機異常の有無" },
        ],
      },
      {
        id: "brake_lateral",
        title: "ブレーキ",
        items: [
          { id: "lining_wear_lateral", label: "ライニング摩耗の有無" },
          { id: "solenoid_shoe_pin_lateral", label: "ソレノイド・シュー・ピン 摩耗作動の有無" },
        ],
      },
      {
        id: "lateral_rail",
        title: "横行レール",
        items: [
          { id: "rail_curvature_lateral", label: "レール曲り及び異常の有無" },
          { id: "stopper_attachment", label: "ストッパー取付状況" },
        ],
      },
    ],
  },
  {
    id: "travel",
    title: "走行部",
    categories: [
      {
        id: "travel_rail",
        title: "走行レール",
        items: [
          { id: "crane_girder_obstacle", label: "クレーンガータの走行範囲障害物の有無" },
          { id: "rail_curvature_travel", label: "レール曲り及び異常の有無" },
          { id: "rail_end_stopper", label: "レール両端のストッパー状況および取付ボルト緩みの有無" },
          { id: "rail_bolt_travel", label: "レール取付ボルト緩みの有無" },
        ],
      },
      {
        id: "girder_saddle",
        title: "ガータおよびサドル",
        items: [
          { id: "girder_saddle_bolt", label: "ガータ・サドル取付ボルト緩みの有無" },
          { id: "guide_roller_wear_girder", label: "ガイドローラー摩耗の有無" },
          { id: "wheel_gear_oil", label: "ホイールギャ歯面および車軸給油状況の良否" },
          { id: "wheel_tread_flange_wear", label: "走行車軸の踏面・フランヂ異常摩耗外傷の有無" },
          { id: "wheel_axis_keyplate", label: "車輪軸キープレート変形・緩みの有無" },
          { id: "saddle_buffer_fix", label: "サドルのバッファ固定状況" },
        ],
      },
      {
        id: "travel_mechanical",
        title: "走行機械装置",
        items: [
          { id: "wheel_axis_keyplate_mech", label: "車輪軸キープレート変形・緩みの有無" },
          { id: "travel_motor_reducer", label: "走行電動減速機異常の有無" },
          { id: "chain_gear_coupling", label: "チェン・ギャー・カップリング軸受摩耗の有無" },
          { id: "lining_wear_mech", label: "ライニング摩耗の有無" },
          { id: "solenoid_shoe_pin_mech", label: "ソレノイド・シュー・ピン摩耗作動の有無" },
        ],
      },
    ],
  },
  {
    id: "travel_electrical",
    title: "走行電気部",
    categories: [
      {
        id: "collector_device",
        title: "集電装置ほか",
        items: [
          { id: "cushion_starter", label: "クッションスターター作動状況" },
          { id: "collector_trolley_wear", label: "コレクター・トロリー線摩耗・変形の有無" },
          { id: "cabtyre_carrier", label: "キャブタイヤー・キャリアー破損・老化の有無" },
          { id: "control_panel_electrical", label: "制御盤・電気機器緩みの有無" },
          { id: "limit_switch_lever", label: "リミットスイッチ・レバー作動確認" },
        ],
      },
      {
        id: "oil",
        title: "給油",
        items: [
          { id: "hoisting_travel_oil", label: "巻上部・走行部給油状況" },
        ],
      },
    ],
  },
  {
    id: "other",
    title: "その他",
    categories: [
      {
        id: "insulation_resistance",
        title: "絶縁抵抗",
        items: [
          { id: "insulation_resistance_value", label: "絶縁抵抗（MΩ）" },
        ],
      },
      {
        id: "push_button_switch",
        title: "押釦スイッチ",
        items: [
          { id: "contact_wear_push", label: "接点摩耗の有無" },
          { id: "wiring_bolt_loose", label: "配線締付ネジゆるみの有無" },
          { id: "case_insulation_damage", label: "ケースおよび絶縁板損傷の有無" },
          { id: "cabtyre_aging_push", label: "キャプタイヤー老化・変形の有無" },
        ],
      },
      {
        id: "magnet_switch",
        title: "マグネットスイッチ",
        items: [
          { id: "contact_wear_magnet", label: "接点摩耗の有無" },
          { id: "wiring_bolt_loose_magnet", label: "配線締付ネジゆるみの有無" },
          { id: "operation_check", label: "作動確認" },
        ],
      },
    ],
  },
];

interface WorkRecord {
  id: string;
  workType: "INSPECTION" | "REPAIR" | "MAINTENANCE" | "OTHER";
  inspectionDate: Date;
  overallJudgment: "GOOD" | "CAUTION" | "BAD" | "REPAIR" | null;
  findings: string | null;
  summary: string | null;
  additionalNotes: string | null;
  checklistData: string | null;
  photos: string | null;
  updatedAt: Date;
  equipment: {
    id: string;
    name: string;
    model: string | null;
    serialNumber: string | null;
    location: string | null;
    company: {
      id: string;
      name: string;
    };
    project: {
      id: string;
      title: string;
      status: string;
      startDate: Date | null;
      endDate: Date | null;
      amount: number | null;
    } | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
}

interface ClientWorkRecordDetailProps {
  workRecord: WorkRecord;
  canEdit: boolean;
}

const workTypeOptions = [
  { value: "INSPECTION", label: "点検" },
  { value: "REPAIR", label: "修理" },
  { value: "MAINTENANCE", label: "メンテナンス" },
  { value: "OTHER", label: "その他" },
];

const workTypeLabels: Record<string, string> = {
  INSPECTION: "点検",
  REPAIR: "修理",
  MAINTENANCE: "メンテナンス",
  OTHER: "その他",
};

const workTypeColors: Record<string, string> = {
  INSPECTION: "bg-blue-100 text-blue-800",
  REPAIR: "bg-red-100 text-red-800",
  MAINTENANCE: "bg-purple-100 text-purple-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const judgmentOptions = [
  { value: "GOOD", label: "良好" },
  { value: "CAUTION", label: "注意" },
  { value: "BAD", label: "不良" },
  { value: "REPAIR", label: "要修理" },
];

const judgmentLabels: Record<string, string> = {
  GOOD: "良好",
  CAUTION: "注意",
  BAD: "不良",
  REPAIR: "要修理",
};

const judgmentColors: Record<string, string> = {
  GOOD: "bg-green-100 text-green-800",
  CAUTION: "bg-yellow-100 text-yellow-800",
  BAD: "bg-orange-100 text-orange-800",
  REPAIR: "bg-red-100 text-red-800",
};

export default function ClientWorkRecordDetail({
  workRecord: initialWorkRecord,
  canEdit,
}: ClientWorkRecordDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [workRecord, setWorkRecord] = useState(initialWorkRecord);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [isEquipmentSelectModalOpen, setIsEquipmentSelectModalOpen] = useState(false);
  const [isProjectSelectModalOpen, setIsProjectSelectModalOpen] = useState(false);
  
  // 点検結果データをパースして管理
  const [checklistData, setChecklistData] = useState<Record<string, Record<string, Record<string, string>>>>(() => {
    if (workRecord.checklistData) {
      try {
        return JSON.parse(workRecord.checklistData);
      } catch {
        return {};
      }
    }
    return {};
  });

  const updateWorkRecord = async (field: string, value: any) => {
    if (!canEdit) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/work-records/${workRecord.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [field]: value,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      const updated = await response.json();
      setWorkRecord(updated);
      // router.refresh()は不要（APIレスポンスで既に最新データを取得している）
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // 処置不良内容の個別項目を更新
  const handleChecklistDefectChange = async (
    sectionId: string,
    categoryId: string,
    itemId: string,
    value: string
  ) => {
    if (!canEdit) return;

    // ローカル状態を更新
    const newChecklistData = { ...checklistData };
    if (!newChecklistData[sectionId]) {
      newChecklistData[sectionId] = {};
    }
    if (!newChecklistData[sectionId][categoryId]) {
      newChecklistData[sectionId][categoryId] = {};
    }
    
    const defectKey = `${itemId}_defect`;
    if (value) {
      newChecklistData[sectionId][categoryId][defectKey] = value;
    } else {
      delete newChecklistData[sectionId][categoryId][defectKey];
      // 空のオブジェクトを削除
      if (Object.keys(newChecklistData[sectionId][categoryId]).length === 0) {
        delete newChecklistData[sectionId][categoryId];
      }
      if (Object.keys(newChecklistData[sectionId]).length === 0) {
        delete newChecklistData[sectionId];
      }
    }
    
    setChecklistData(newChecklistData);

    // データベースに保存
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/work-records/${workRecord.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checklistData: JSON.stringify(newChecklistData),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      const updated = await response.json();
      setWorkRecord(updated);
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました");
      // エラー時は元の状態に戻す
      setChecklistData(JSON.parse(workRecord.checklistData || "{}"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (field: string, value: any) => {
    await updateWorkRecord(field, value);
  };

  // 点検結果の個別項目を更新
  const handleChecklistItemChange = async (
    sectionId: string,
    categoryId: string,
    itemId: string,
    value: string
  ) => {
    if (!canEdit) return;

    // ローカル状態を更新
    const newChecklistData = { ...checklistData };
    if (!newChecklistData[sectionId]) {
      newChecklistData[sectionId] = {};
    }
    if (!newChecklistData[sectionId][categoryId]) {
      newChecklistData[sectionId][categoryId] = {};
    }
    
    if (value) {
      newChecklistData[sectionId][categoryId][itemId] = value;
    } else {
      delete newChecklistData[sectionId][categoryId][itemId];
      // 空のオブジェクトを削除
      if (Object.keys(newChecklistData[sectionId][categoryId]).length === 0) {
        delete newChecklistData[sectionId][categoryId];
      }
      if (Object.keys(newChecklistData[sectionId]).length === 0) {
        delete newChecklistData[sectionId];
      }
    }
    
    setChecklistData(newChecklistData);

    // データベースに保存
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/work-records/${workRecord.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checklistData: JSON.stringify(newChecklistData),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      const updated = await response.json();
      setWorkRecord(updated);
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました");
      // エラー時は元の状態に戻す
      setChecklistData(JSON.parse(workRecord.checklistData || "{}"));
    } finally {
      setIsSaving(false);
    }
  };

  // workRecordが更新されたときにchecklistDataも更新
  useEffect(() => {
    if (workRecord.checklistData) {
      try {
        setChecklistData(JSON.parse(workRecord.checklistData));
      } catch {
        setChecklistData({});
      }
    } else {
      setChecklistData({});
    }
  }, [workRecord.checklistData]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/work-records"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {new Date(workRecord.inspectionDate).toLocaleDateString(
                "ja-JP"
              )}{" "}
              の作業記録
            </h1>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              workTypeColors[workRecord.workType]
            }`}
          >
            {workTypeLabels[workRecord.workType]}
          </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session?.user.role === "ADMIN" && (
            <DeleteItemButton
              apiPath="/api/work-records"
              itemId={workRecord.id}
              resourceName="作業記録"
              redirectPath="/work-records"
            />
          )}
        </div>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            内容
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            編集履歴
          </button>
        </nav>
      </div>

      {activeTab === "overview" ? (
        <>
      {/* 基本情報 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <InlineEditSelect
              label="作業タイプ"
              value={workRecord.workType}
              onSave={(value) => handleSave("workType", value)}
              options={workTypeOptions}
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
            <InlineEditField
              label="備考"
              value={workRecord.findings || ""}
              onSave={(value) => handleSave("findings", value || null)}
              multiline
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          </div>
          <div className="space-y-6">
            <InlineEditField
              label="作業日"
              value={new Date(workRecord.inspectionDate)
                .toISOString()
                .split("T")[0]}
              onSave={(value) =>
                handleSave("inspectionDate", new Date(value).toISOString())
              }
              type="date"
              placeholder="日付を選択"
              className={canEdit ? "" : "pointer-events-none opacity-60"}
            />
          </div>
        </div>
      </div>

      {/* 関連情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 関連機器情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">関連機器情報</h2>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEquipmentSelectModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + 追加
              </button>
            )}
          </div>
          <button
            onClick={() => setSelectedEquipmentId(workRecord.equipment.id)}
            className="w-full text-left bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="grid grid-cols-5 gap-4">
              <div className="flex flex-col">
                <div className="text-xs font-medium text-gray-500 mb-1">関連機器名称</div>
                <div className="text-sm text-gray-900 font-medium">
                  {workRecord.equipment.name}
                </div>
              </div>
              {workRecord.equipment.model && (
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-gray-500 mb-1">機種・型式</div>
                  <div className="text-sm text-gray-900">
                    {workRecord.equipment.model}
                  </div>
                </div>
              )}
              {workRecord.equipment.serialNumber && (
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-gray-500 mb-1">製造番号</div>
                  <div className="text-sm text-gray-900">
                    {workRecord.equipment.serialNumber}
                  </div>
                </div>
              )}
              {workRecord.equipment.location && (
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-gray-500 mb-1">設置場所</div>
                  <div className="text-sm text-gray-900">
                    {workRecord.equipment.location}
                  </div>
                </div>
              )}
              <div className="flex flex-col">
                <div className="text-xs font-medium text-gray-500 mb-1">関連取引先</div>
                <div className="text-sm text-gray-900">
                  {workRecord.equipment.company.name}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* 関連プロジェクト情報 */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">関連プロジェクト</h2>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsProjectSelectModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-bold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                + 追加
              </button>
            )}
          </div>
          {workRecord.equipment.project ? (
            <button
              onClick={() => setSelectedProjectId(workRecord.equipment.project!.id)}
              className="w-full text-left bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="grid grid-cols-5 gap-4">
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-gray-500 mb-1">プロジェクトタイトル</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {workRecord.equipment.project.title}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-gray-500 mb-1">開始日</div>
                  <div className="text-sm text-gray-900">
                    {workRecord.equipment.project.startDate
                      ? new Date(workRecord.equipment.project.startDate).toLocaleDateString("ja-JP")
                      : "-"}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-gray-500 mb-1">終了日</div>
                  <div className="text-sm text-gray-900">
                    {workRecord.equipment.project.endDate
                      ? new Date(workRecord.equipment.project.endDate).toLocaleDateString("ja-JP")
                      : "-"}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-gray-500 mb-1">金額</div>
                  <div className="text-sm text-gray-900">
                    {workRecord.equipment.project.amount
                      ? `¥${workRecord.equipment.project.amount.toLocaleString("ja-JP")}`
                      : "-"}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-gray-500 mb-1">ステータス</div>
                  <div className="text-sm text-gray-900">
                    {workRecord.equipment.project.status === "IN_PROGRESS"
                      ? "進行中"
                      : workRecord.equipment.project.status === "COMPLETED"
                      ? "完了"
                      : workRecord.equipment.project.status === "PLANNING"
                      ? "計画中"
                      : workRecord.equipment.project.status === "ON_HOLD"
                      ? "保留"
                      : workRecord.equipment.project.status}
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">関連プロジェクトがありません</p>
            </div>
          )}
        </div>
      </div>

      {/* 点検結果 */}
      {workRecord.workType === "INSPECTION" && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">点検結果</h2>
          <p className="text-sm text-gray-600 mb-4">
            判定凡例: V…良　△…修理要　×…特急修理要　H…手直し済　P…部品取替済　A…調整済　T…増締済　O…給油脂済　S…清掃済　K…経過観察要
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {INSPECTION_ITEMS.map((section, sectionIndex) => {
                const sectionData = checklistData[section.id] || {};
                
                return (
                  <div key={section.id}>
                    {/* セクションタイトル */}
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {sectionIndex + 1}．{section.title}
                      </h3>
                    </div>
                    {/* カテゴリと項目 */}
                    {section.categories.map((category, categoryIndex) => {
                      const categoryData = sectionData[category.id] || {};
                      
                      return (
                        <div key={category.id}>
                          {/* カテゴリタイトル */}
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h4 className="text-sm font-medium text-gray-800">
                              {sectionIndex + 1}-{categoryIndex + 1}．{category.title}
                            </h4>
                          </div>
                              {/* カテゴリ内の項目 */}
                              <div className="bg-white divide-y divide-gray-100">
                                {category.items.map((item, itemIndex) => {
                                  const itemValue = categoryData[item.id] || "";
                                  const defectValue = categoryData[`${item.id}_defect`] || "";
                                  const symbol = JUDGMENT_SYMBOLS.find((s) => s.value === itemValue);
                                  const defectOption = DEFECT_OPTIONS.find((d) => d.value === defectValue);
                                  
                                  return (
                                    <div
                                      key={item.id}
                                      className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 py-2 hover:bg-gray-50 items-center"
                                    >
                                      <div className="flex items-center">
                                        <span className="text-sm text-gray-700">
                                          {sectionIndex + 1}-{categoryIndex + 1}-{itemIndex + 1}．{item.label}
                                        </span>
                                      </div>
                                      <div>
                                        {canEdit ? (
                                            <select
                                              value={itemValue}
                                              onChange={(e) => handleChecklistItemChange(
                                                section.id,
                                                category.id,
                                                item.id,
                                                e.target.value
                                              )}
                                              disabled={isSaving}
                                              className="w-full rounded-md border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <option value="">選択してください</option>
                                              {JUDGMENT_SYMBOLS.map((symbol) => (
                                                <option key={symbol.value} value={symbol.value}>
                                                  {symbol.label}
                                                </option>
                                              ))}
                                            </select>
                                        ) : (
                                          <span className="text-sm font-medium text-gray-900">
                                            {symbol ? symbol.label : itemValue || "-"}
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        {canEdit ? (
                                          <select
                                            value={defectValue}
                                            onChange={(e) => handleChecklistDefectChange(
                                              section.id,
                                              category.id,
                                              item.id,
                                              e.target.value
                                            )}
                                            disabled={isSaving}
                                            className="w-full rounded-md border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            <option value="">選択してください</option>
                                            {DEFECT_OPTIONS.map((option) => (
                                              <option key={option.value} value={option.value}>
                                                {option.label}
                                              </option>
                                            ))}
                                          </select>
                                        ) : (
                                          <span className="text-sm font-medium text-gray-900">
                                            {defectOption ? defectOption.label : "-"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <HistoryTab entityType="WorkRecord" entityId={workRecord.id} />
      )}

      {/* プロジェクト詳細モーダル */}
      {selectedProjectId && (
        <ProjectDetailModal
          isOpen={!!selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
          projectId={selectedProjectId}
          canEdit={canEdit}
          onUnlink={async () => {
            // 作業記録詳細画面では関連外し機能は使用しない
          }}
        />
      )}

      {/* 機器詳細モーダル */}
      {selectedEquipmentId && (
        <EquipmentDetailModal
          isOpen={!!selectedEquipmentId}
          onClose={() => setSelectedEquipmentId(null)}
          equipmentId={selectedEquipmentId}
          canEdit={canEdit}
          onUnlink={async () => {
            // 作業記録詳細画面では関連外し機能は使用しない
          }}
        />
      )}

      {/* 機器選択モーダル */}
      <EquipmentSelectModal
        isOpen={isEquipmentSelectModalOpen}
        onClose={() => setIsEquipmentSelectModalOpen(false)}
        companyId={workRecord.equipment.company.id}
        projectId={workRecord.equipment.project?.id || ""}
        onSelect={async (equipmentList) => {
          if (equipmentList.length === 0) return;
          const selectedEquipment = equipmentList[0];
          try {
            const response = await fetch(`/api/work-records/${workRecord.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                equipmentId: selectedEquipment.id,
              }),
            });

            if (!response.ok) {
              throw new Error("機器の変更に失敗しました");
            }

            const updated = await response.json();
            setWorkRecord(updated);
            router.refresh();
          } catch (error) {
            console.error("機器変更エラー:", error);
            alert("機器の変更に失敗しました");
            throw error;
          }
        }}
      />

      {/* プロジェクト選択モーダル */}
      <ProjectSelectModal
        isOpen={isProjectSelectModalOpen}
        onClose={() => setIsProjectSelectModalOpen(false)}
        companyId={workRecord.equipment.company.id}
        onSelect={async (projectId) => {
          try {
            const response = await fetch(`/api/equipment/${workRecord.equipment.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId: projectId,
              }),
            });

            if (!response.ok) {
              throw new Error("プロジェクトの関連付けに失敗しました");
            }

            router.refresh();
          } catch (error) {
            console.error("プロジェクト関連付けエラー:", error);
            alert("プロジェクトの関連付けに失敗しました");
            throw error;
          }
        }}
      />
    </div>
  );
}

