"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DatePicker from "@/components/common/date-picker";
import { useSession } from "next-auth/react";

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

// バリデーションスキーマ
const inspectionFormSchema = z.object({
  documentNumber: z.string().optional(),
  installationFactory: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  inspectionDate: z.string().min(1, "点検実施日は必須です"),
  checklistData: z.string().optional(), // JSON形式で保存
  notes: z.string().optional(), // 備考
});

type InspectionFormData = z.infer<typeof inspectionFormSchema>;

interface InspectionRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  onSuccess?: () => void;
}

interface Equipment {
  id: string;
  name: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  company?: {
    name: string;
  };
}

export default function InspectionRecordModal({
  isOpen,
  onClose,
  equipmentId,
  onSuccess,
}: InspectionRecordModalProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionFormSchema),
  });

  // 機器情報を取得
  useEffect(() => {
    if (isOpen && equipmentId) {
      const fetchEquipment = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/equipment/${equipmentId}`);
          if (response.ok) {
            const data = await response.json();
            setEquipment(data);
            // 機器情報をフォームに設定
            setValue("model", data.model || "");
            setValue("serialNumber", data.serialNumber || "");
            setValue("installationFactory", data.location || "");
          }
        } catch (err) {
          console.error("機器情報の取得に失敗しました:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEquipment();
    }
  }, [isOpen, equipmentId, setValue]);

  // モーダルを閉じたときにリセット
  useEffect(() => {
    if (!isOpen) {
      reset();
      setError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: InspectionFormData) => {
    if (!session?.user?.id) {
      setError("ログインが必要です");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // チェックリストデータを構築（3階層構造）
      const checklistData: Record<string, Record<string, Record<string, string>>> = {};
      INSPECTION_ITEMS.forEach((section) => {
        checklistData[section.id] = {};
        section.categories.forEach((category) => {
          checklistData[section.id][category.id] = {};
          category.items.forEach((item) => {
            const value = watch(`${section.id}_${category.id}_${item.id}` as any);
            if (value) {
              checklistData[section.id][category.id][item.id] = value;
            }
          });
        });
      });

      const response = await fetch("/api/work-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipmentId: equipmentId,
          userId: session.user.id,
          workType: "INSPECTION",
          inspectionDate: data.inspectionDate,
          additionalNotes: data.notes || undefined,
          checklistData: JSON.stringify(checklistData),
          documentNumber: data.documentNumber || undefined,
          installationFactory: data.installationFactory || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "作業記録の作成に失敗しました");
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "作業記録の作成に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">作業記録登録</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">読み込み中...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 基本情報 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    🔧 基本情報
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        点検実施日 <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        value={watch("inspectionDate") || undefined}
                        onChange={(value) => setValue("inspectionDate", value, { shouldValidate: true })}
                        placeholder="日付を選択"
                      />
                      <input
                        type="hidden"
                        {...register("inspectionDate")}
                      />
                      {errors.inspectionDate && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.inspectionDate.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        整理番号
                      </label>
                      <input
                        type="text"
                        {...register("documentNumber")}
                        className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        設置工場
                      </label>
                      <input
                        type="text"
                        {...register("installationFactory")}
                        className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        型式
                      </label>
                      <input
                        type="text"
                        {...register("model")}
                        disabled
                        className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-gray-500 bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        製番
                      </label>
                      <input
                        type="text"
                        {...register("serialNumber")}
                        disabled
                        className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-gray-500 bg-gray-100"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        備考
                      </label>
                      <textarea
                        {...register("notes")}
                        rows={4}
                        placeholder="自由入力"
                        className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 点検項目 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    🔧 点検項目
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    判定凡例: V…良　△…修理要　×…特急修理要　H…手直し済　P…部品取替済　A…調整済　T…増締済　O…給油脂済　S…清掃済　K…経過観察要
                  </p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {INSPECTION_ITEMS.map((section, sectionIndex) => (
                        <div key={section.id}>
                          {/* セクションタイトル */}
                          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {sectionIndex + 1}．{section.title}
                            </h4>
                          </div>
                          {/* カテゴリと項目 */}
                          {section.categories.map((category, categoryIndex) => (
                            <div key={category.id}>
                              {/* カテゴリタイトル */}
                              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                <h5 className="text-sm font-medium text-gray-800">
                                  {sectionIndex + 1}-{categoryIndex + 1}．{category.title}
                                </h5>
                              </div>
                              {/* カテゴリ内の項目 */}
                              <div className="bg-white divide-y divide-gray-100">
                                {category.items.map((item, itemIndex) => (
                                  <div
                                    key={item.id}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 py-2 hover:bg-gray-50 items-center"
                                  >
                                    <div className="flex items-center">
                                      <label className="text-sm text-gray-700">
                                        {sectionIndex + 1}-{categoryIndex + 1}-{itemIndex + 1}．{item.label}
                                      </label>
                                    </div>
                                    <div>
                                      <select
                                        {...register(`${section.id}_${category.id}_${item.id}` as any)}
                                        className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                      >
                                        <option value="">選択してください</option>
                                        {JUDGMENT_SYMBOLS.map((symbol) => (
                                          <option key={symbol.value} value={symbol.value}>
                                            {symbol.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <select
                                        {...register(`${section.id}_${category.id}_${item.id}_defect` as any)}
                                        className="w-full rounded-md border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                      >
                                        <option value="">選択してください</option>
                                        {DEFECT_OPTIONS.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ボタン */}
                <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={isSubmitting}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "保存中..." : "保存"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

