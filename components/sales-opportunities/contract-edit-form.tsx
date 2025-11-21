"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import DatePicker from "@/components/common/date-picker";

// 受注明細のバリデーションスキーマ
const contractItemSchema = z.object({
  description: z.string().min(1, "明細内容は必須です"),
  quantity: z.string().optional(),
  unitPrice: z.string().optional(),
  amount: z.string().min(1, "金額は必須です"),
  notes: z.string().optional(),
});

// 受注書のバリデーションスキーマ
const contractFormSchema = z.object({
  items: z.array(contractItemSchema).min(1, "少なくとも1つの明細が必要です"),
  contractDate: z.string().min(1, "契約日は必須です"),
  conditions: z.string().optional(),
  status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

interface Contract {
  id: string;
  contractNumber: string;
  contractDate: Date | string;
  amount: number;
  conditions: string | null;
  status: string;
  items: Array<{
    id: string;
    itemNumber: number;
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    amount: number;
    notes: string | null;
  }>;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface ContractEditFormProps {
  contract: Contract;
  onSuccess: (contract: Contract) => void;
  onCancel: () => void;
  salesOpportunityId: string;
}

/**
 * 受注書編集フォームコンポーネント
 */
export default function ContractEditForm({
  contract,
  onSuccess,
  onCancel,
  salesOpportunityId,
}: ContractEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(contract.amount);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      contractDate: new Date(contract.contractDate).toISOString().split("T")[0],
      conditions: contract.conditions || "",
      items: contract.items.map((item) => ({
        description: item.description,
        quantity: item.quantity?.toString() || "",
        unitPrice: item.unitPrice?.toString() || "",
        amount: item.amount.toString(),
        notes: item.notes || "",
      })),
    },
    shouldFocusError: false,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // 明細を監視して合計金額を計算
  const watchedItems = watch("items");

  useEffect(() => {
    const total = watchedItems.reduce((sum, item) => {
      const amount = parseFloat(item.amount || "0");
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    setTotalAmount(total);
  }, [watchedItems]);

  // 数量×単価で金額を自動計算（整数）
  const calculateAmount = (index: number) => {
    const item = watchedItems[index];
    if (!item) return;
    const quantity = parseFloat(item.quantity || "0");
    const unitPrice = parseFloat(item.unitPrice || "0");

    if (!isNaN(quantity) && !isNaN(unitPrice) && quantity > 0 && unitPrice > 0) {
      const calculatedAmount = Math.round(quantity * unitPrice);
      setValue(`items.${index}.amount`, calculatedAmount.toString(), {
        shouldValidate: true,
      });
    }
  };

  const onSubmit = async (data: ContractFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 明細の合計金額を計算（整数）
      const calculatedTotal = data.items.reduce((sum, item) => {
        const amount = parseFloat(item.amount || "0");
        return sum + (isNaN(amount) ? 0 : Math.round(amount));
      }, 0);

      const response = await fetch(
        `/api/sales-opportunities/${salesOpportunityId}/contracts/${contract.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: data.items.map((item, index) => ({
              itemNumber: index + 1,
              description: item.description,
              quantity: item.quantity ? Math.round(parseFloat(item.quantity)) : null,
              unitPrice: item.unitPrice ? Math.round(parseFloat(item.unitPrice)) : null,
              amount: Math.round(parseFloat(item.amount || "0")),
              notes: item.notes || null,
            })),
            contractDate: data.contractDate,
            conditions: data.conditions || null,
            status: data.status || "DRAFT",
            amount: calculatedTotal,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("受注書更新エラー:", errorData);
        const errorMessage = errorData.details
          ? `${errorData.error || "受注書の更新に失敗しました"}\n${JSON.stringify(errorData.details, null, 2)}`
          : errorData.error || "受注書の更新に失敗しました";
        throw new Error(errorMessage);
      }

      const updatedContract = await response.json();
      onSuccess(updatedContract);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "受注書の更新に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800 whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {/* 契約日 */}
      <div>
        <label
          htmlFor="contractDate"
          className="block text-sm font-medium text-gray-900"
        >
          契約日 <span className="text-red-500">*</span>
        </label>
        <DatePicker
          value={watch("contractDate") || undefined}
          onChange={(value) =>
            setValue("contractDate", value, { shouldValidate: true })
          }
          placeholder="日付を選択"
          className="mt-1"
        />
        <input
          type="hidden"
          id="contractDate"
          {...register("contractDate")}
        />
        {errors.contractDate && (
          <p className="mt-1 text-sm text-red-600">
            {errors.contractDate.message}
          </p>
        )}
      </div>

      {/* 受注明細 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">受注明細</h3>
          <button
            type="button"
            onClick={() =>
              append({
                description: "",
                quantity: "",
                unitPrice: "",
                amount: "",
                notes: "",
              })
            }
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            <PlusIcon className="h-4 w-4" />
            明細を追加
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  明細 {index + 1}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                {/* 明細内容 */}
                <div className="sm:col-span-12">
                  <label className="block text-sm font-medium text-gray-900">
                    明細内容 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register(`items.${index}.description` as const)}
                    placeholder="例: 天井クレーン点検作業"
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
                  />
                  {errors.items?.[index]?.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>

                {/* 数量 */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-900">
                    数量
                  </label>
                  <input
                    type="number"
                    step="1"
                    {...register(`items.${index}.quantity` as const)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const intValue = value ? Math.floor(parseFloat(value)) : "";
                      setValue(`items.${index}.quantity` as const, intValue.toString(), {
                        shouldValidate: true,
                      });
                      calculateAmount(index);
                    }}
                    onBlur={() => calculateAmount(index)}
                    placeholder="例: 1"
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                {/* 単価 */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-900">
                    単価
                  </label>
                  <input
                    type="number"
                    step="1"
                    {...register(`items.${index}.unitPrice` as const)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const intValue = value ? Math.floor(parseFloat(value)) : "";
                      setValue(`items.${index}.unitPrice` as const, intValue.toString(), {
                        shouldValidate: true,
                      });
                      calculateAmount(index);
                    }}
                    onBlur={() => calculateAmount(index)}
                    placeholder="例: 100000"
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                {/* 金額 */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-900">
                    金額 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    {...register(`items.${index}.amount` as const)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const intValue = value ? Math.floor(parseFloat(value)) : "";
                      setValue(`items.${index}.amount` as const, intValue.toString(), {
                        shouldValidate: true,
                      });
                    }}
                    placeholder="例: 100000"
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
                  />
                  {errors.items?.[index]?.amount && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.items[index]?.amount?.message}
                    </p>
                  )}
                </div>

                {/* 備考 */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-900">
                    備考
                  </label>
                  <input
                    type="text"
                    {...register(`items.${index}.notes` as const)}
                    placeholder="備考"
                    className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 合計金額 */}
        <div className="flex justify-end border-t border-gray-200 pt-4">
          <div className="text-right">
            <span className="text-sm font-medium text-gray-700">合計金額: </span>
            <span className="text-lg font-bold text-gray-900">
              ¥{totalAmount.toLocaleString("ja-JP")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* ステータス */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-900"
          >
            ステータス
          </label>
          <select
            id="status"
            {...register("status")}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          >
            <option value="DRAFT">下書き</option>
            <option value="CONFIRMED">確定</option>
            <option value="CANCELLED">キャンセル</option>
          </select>
        </div>
      </div>

      {/* 契約条件 */}
      <div>
        <label
          htmlFor="conditions"
          className="block text-sm font-medium text-gray-900"
        >
          契約条件
        </label>
        <textarea
          id="conditions"
          rows={3}
          {...register("conditions")}
          placeholder="例: 納期: 2週間、支払い条件: 着工前50%、完了後50%"
          className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {errors.items && (
        <div>
          <p className="text-sm text-red-600">{errors.items.message}</p>
        </div>
      )}

      {/* ボタン */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
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
  );
}

