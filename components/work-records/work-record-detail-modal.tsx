"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import WorkRecordTemplateSelector from "./work-record-template-selector";

interface WorkRecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workRecordId: string;
}

interface WorkRecord {
  id: string;
  workType: string;
  inspectionDate: string;
  overallJudgment: string | null;
  findings: string | null;
  summary: string | null;
  additionalNotes: string | null;
  documentNumber: string | null;
  installationFactory: string | null;
  checklistData: string | null;
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
    } | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
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

const judgmentOptions = [
  { value: "GOOD", label: "良" },
  { value: "CAUTION", label: "注意" },
  { value: "BAD", label: "不良" },
  { value: "REPAIR", label: "修理" },
];

const judgmentLabels: Record<string, string> = {
  GOOD: "良",
  CAUTION: "注意",
  BAD: "不良",
  REPAIR: "修理",
};

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
          { id: "stopper_lateral", label: "ストッパー取付状況" },
        ],
      },
    ],
  },
  {
    id: "traveling",
    title: "走行部",
    categories: [
      {
        id: "traveling_rail",
        title: "走行レール",
        items: [
          { id: "obstacle", label: "クレーンガータの走行範囲障害物の有無" },
          { id: "rail_curvature", label: "レール曲り及び異常の有無" },
          { id: "rail_end_stopper", label: "レール両端のストッパー状況および取付ボルト緩みの有無" },
          { id: "rail_bolt", label: "レール取付ボルト緩みの有無" },
        ],
      },
      {
        id: "girder_saddle",
        title: "ガータおよびサドル",
        items: [
          { id: "girder_saddle_bolt", label: "ガータ・サドル取付ボルト緩みの有無" },
          { id: "guide_roller_wear", label: "ガイドローラー摩耗の有無" },
          { id: "wheel_gear_oil", label: "ホイールギャ歯面および車軸給油状況の良否" },
          { id: "wheel_axle_wear", label: "走行車軸の踏面・フランヂ異常摩耗外傷の有無" },
          { id: "wheel_axle_keep", label: "車輪軸キープレート変形・緩みの有無" },
          { id: "saddle_buffer", label: "サドルのバッファ固定状況" },
        ],
      },
      {
        id: "traveling_mechanical",
        title: "走行機械装置",
        items: [
          { id: "traveling_motor_reducer", label: "走行電動減速機異常の有無" },
          { id: "chain_gear_coupling", label: "チェン・ギャー・カップリング軸受摩耗の有無" },
          { id: "lining_wear_mechanical", label: "ライニング摩耗の有無" },
          { id: "solenoid_shoe_pin_mechanical", label: "ソレノイド・シュー・ピン摩耗作動の有無" },
        ],
      },
    ],
  },
  {
    id: "traveling_electrical",
    title: "走行電気部",
    categories: [
      {
        id: "collector",
        title: "集電装置ほか",
        items: [
          { id: "cushion_starter", label: "クッションスターター作動状況" },
          { id: "collector_trolley", label: "コレクター・トロリー線摩耗・変形の有無" },
          { id: "cabtyre_carrier", label: "キャブタイヤー・キャリアー破損・老化の有無" },
          { id: "control_panel", label: "制御盤・電気機器緩みの有無" },
          { id: "limit_switch_lever", label: "リミットスイッチ・レバー作動確認" },
        ],
      },
      {
        id: "lubrication",
        title: "給油",
        items: [
          { id: "hoisting_traveling_oil", label: "巻上部・走行部給油状況" },
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
        id: "push_button",
        title: "押釦スイッチ",
        items: [
          { id: "contact_wear_button", label: "接点摩耗の有無" },
          { id: "wiring_screw", label: "配線締付ネジゆるみの有無" },
          { id: "case_insulation", label: "ケースおよび絶縁板損傷の有無" },
          { id: "cabtyre_aging", label: "キャプタイヤー老化・変形の有無" },
        ],
      },
      {
        id: "magnet_switch",
        title: "マグネットスイッチ",
        items: [
          { id: "contact_wear_magnet", label: "接点摩耗の有無" },
          { id: "wiring_screw_magnet", label: "配線締付ネジゆるみの有無" },
          { id: "operation_check", label: "作動確認" },
        ],
      },
    ],
  },
];

export default function WorkRecordDetailModal({
  isOpen,
  onClose,
  workRecordId,
}: WorkRecordDetailModalProps) {
  const { data: session } = useSession();
  const [workRecord, setWorkRecord] = useState<WorkRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isWorkRecordTemplateModalOpen, setIsWorkRecordTemplateModalOpen] = useState(false);
  
  // 編集用のローカル状態
  const [editFormData, setEditFormData] = useState<{
    workType: string;
    inspectionDate: string;
    findings: string | null;
  }>({
    workType: "",
    inspectionDate: "",
    findings: null,
  });
  
  // 点検結果データをパースして管理
  const [checklistData, setChecklistData] = useState<Record<string, Record<string, Record<string, string>>>>(() => {
    if (workRecord?.checklistData) {
      try {
        return JSON.parse(workRecord.checklistData);
      } catch {
        return {};
      }
    }
    return {};
  });
  
  // 編集用の点検結果データ（一時保存用）
  const [editChecklistData, setEditChecklistData] = useState<Record<string, Record<string, Record<string, string>>>>({});

  const canEdit = session?.user.role === "ADMIN" || session?.user.role === "EDITOR";

  useEffect(() => {
    if (isOpen && workRecordId) {
      fetchWorkRecord();
      setIsEditing(false); // モーダルを開くたびに編集モードをリセット
    }
  }, [isOpen, workRecordId]);

  // workRecordが更新されたときにchecklistDataも更新
  useEffect(() => {
    if (workRecord?.checklistData) {
      try {
        setChecklistData(JSON.parse(workRecord.checklistData));
      } catch {
        setChecklistData({});
      }
    } else {
      setChecklistData({});
    }
  }, [workRecord?.checklistData]);

  // 編集モードに入ったときに、現在の値を編集用の状態にコピー
  useEffect(() => {
    if (isEditing && workRecord) {
      setEditFormData({
        workType: workRecord.workType,
        inspectionDate: new Date(workRecord.inspectionDate).toISOString().split("T")[0],
        findings: workRecord.findings,
      });
      // 点検結果データもコピー
      if (workRecord.checklistData) {
        try {
          setEditChecklistData(JSON.parse(workRecord.checklistData));
        } catch {
          setEditChecklistData({});
        }
      } else {
        setEditChecklistData({});
      }
    }
  }, [isEditing, workRecord]);

  const fetchWorkRecord = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/work-records/${workRecordId}`);
      if (!response.ok) {
        throw new Error("作業記録の取得に失敗しました");
      }
      const data = await response.json();
      setWorkRecord(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作業記録の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };


  // 編集フォームの基本情報フィールドを更新（ローカルのみ）
  const handleFormFieldChange = (field: keyof typeof editFormData, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 点検結果の個別項目を更新（ローカルのみ）
  const handleChecklistItemChange = (
    sectionId: string,
    categoryId: string,
    itemId: string,
    value: string
  ) => {
    const newChecklistData = { ...editChecklistData };
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
    
    setEditChecklistData(newChecklistData);
  };

  // 処置不良内容の個別項目を更新（ローカルのみ）
  const handleChecklistDefectChange = (
    sectionId: string,
    categoryId: string,
    itemId: string,
    value: string
  ) => {
    const newChecklistData = { ...editChecklistData };
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
    
    setEditChecklistData(newChecklistData);
  };

  // 一括保存
  const handleSaveAll = async () => {
    if (!canEdit || !workRecord) return;

    setIsSaving(true);
    try {
      // 空文字列をnullに変換するヘルパー関数
      const toNullIfEmpty = (value: string | null | undefined): string | null => {
        if (value === null || value === undefined || value.trim() === "") {
          return null;
        }
        return value;
      };

      const requestBody = {
        workType: editFormData.workType,
        inspectionDate: new Date(editFormData.inspectionDate).toISOString(),
        findings: toNullIfEmpty(editFormData.findings),
        checklistData: JSON.stringify(editChecklistData),
      };

      console.log("送信するデータ:", requestBody);

      const response = await fetch(
        `/api/work-records/${workRecordId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("APIエラーレスポンス:", errorData);
        
        // バリデーションエラーの詳細を表示
        if (errorData.details && Array.isArray(errorData.details)) {
          const detailMessages = errorData.details.map((d: any) => 
            `${d.path || "不明なフィールド"}: ${d.message}`
          ).join("\n");
          throw new Error(`バリデーションエラー:\n${detailMessages}`);
        }
        
        const errorMessage = errorData.error || "更新に失敗しました";
        throw new Error(errorMessage);
      }

      const updated = await response.json();
      setWorkRecord(updated);
      setIsEditing(false);
    } catch (error) {
      console.error("更新エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "更新に失敗しました";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // キャンセル
  const handleCancel = () => {
    setIsEditing(false);
    // 編集用の状態は、次回編集モードに入ったときに自動的にリセットされる
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* オーバーレイ */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* モーダル */}
        <div className="relative z-10 w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">作業記録詳細</h2>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsWorkRecordTemplateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  <PrinterIcon className="h-4 w-4" />
                  作業記録印刷
                </button>
              )}
              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  編集
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">読み込み中...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
              </div>
            ) : workRecord ? (
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isEditing && canEdit ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            作業タイプ
                          </label>
                          <select
                            value={editFormData.workType}
                            onChange={(e) => handleFormFieldChange("workType", e.target.value)}
                            disabled={isSaving}
                            className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {workTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            作業日
                          </label>
                          <input
                            type="date"
                            value={editFormData.inspectionDate}
                            onChange={(e) => handleFormFieldChange("inspectionDate", e.target.value)}
                            disabled={isSaving}
                            className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            備考
                          </label>
                          <textarea
                            value={editFormData.findings || ""}
                            onChange={(e) => handleFormFieldChange("findings", e.target.value || null)}
                            disabled={isSaving}
                            placeholder="備考を入力"
                            rows={3}
                            className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            作業タイプ
                          </label>
                          <div className="text-sm text-gray-900">
                            {workTypeLabels[workRecord.workType] || workRecord.workType}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            作業日
                          </label>
                          <div className="text-sm text-gray-900">
                            {new Date(workRecord.inspectionDate).toLocaleDateString("ja-JP")}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-500 mb-1">
                            備考
                          </label>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap">
                            {workRecord.findings || "-"}
                          </div>
                        </div>
                        {workRecord.equipment.project && (
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">
                              該当プロジェクト
                            </label>
                            <div className="text-sm text-gray-900">
                              {workRecord.equipment.project.title}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 点検結果 */}
                {((isEditing && editFormData.workType === "INSPECTION") || (!isEditing && workRecord.workType === "INSPECTION" && Object.keys(checklistData).length > 0)) && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">点検結果</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {INSPECTION_ITEMS.map((section, sectionIndex) => {
                          const sectionData = isEditing ? (editChecklistData[section.id] || {}) : (checklistData[section.id] || {});
                          
                          return (
                            <div key={section.id}>
                              {/* セクションタイトル */}
                              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {sectionIndex + 1}．{section.title}
                                </h4>
                              </div>
                              {/* カテゴリと項目 */}
                              {section.categories.map((category, categoryIndex) => {
                                const categoryData = sectionData[category.id] || {};
                                
                                return (
                                  <div key={category.id}>
                                    {/* カテゴリタイトル */}
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                      <h5 className="text-sm font-medium text-gray-800">
                                        {sectionIndex + 1}-{categoryIndex + 1}．{category.title}
                                      </h5>
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
                                            className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 py-2 items-center"
                                          >
                                            <div className="flex items-center">
                                              <span className="text-sm text-gray-700">
                                                {sectionIndex + 1}-{categoryIndex + 1}-{itemIndex + 1}．{item.label}
                                              </span>
                                            </div>
                                            <div>
                                              {isEditing && canEdit ? (
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
                                                <span className="text-sm text-gray-900 font-medium">
                                                  {symbol ? symbol.label : itemValue || "-"}
                                                </span>
                                              )}
                                            </div>
                                            <div>
                                              {isEditing && canEdit ? (
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
                                                <span className="text-sm text-gray-900 font-medium">
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
              </div>
            ) : null}
          </div>

          {/* フッター（保存・キャンセルボタン） */}
          {isEditing && canEdit && (
            <div className="border-t border-gray-200 bg-white px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 作業記録印刷モーダル */}
      <WorkRecordTemplateSelector
        isOpen={isWorkRecordTemplateModalOpen}
        onClose={() => setIsWorkRecordTemplateModalOpen(false)}
        workRecordId={workRecordId}
        onSuccess={() => {
          setIsWorkRecordTemplateModalOpen(false);
        }}
      />
    </div>
  );
}

