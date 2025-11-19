"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DatePicker from "@/components/common/date-picker";
import LookupField from "@/components/common/lookup-field";

// バリデーションスキーマ
const salesOpportunityFormSchema = z.object({
  companyId: z.string().min(1, "取引先は必須です"),
  title: z.string().min(1, "案件タイトルは必須です"),
  status: z.enum(["ESTIMATING", "WON", "LOST"]).optional(),
  estimatedAmount: z.string().optional(),
  craneCount: z.string().optional(),
  craneInfo: z.string().optional(),
  occurredAt: z.string().optional(),
  notes: z.string().optional(),
});

type SalesOpportunityFormData = z.infer<typeof salesOpportunityFormSchema>;

interface SalesOpportunityCreateFormProps {
  onSuccess: (salesOpportunity: any) => void; // 作成した営業案件データ全体を返す
  onCancel: () => void;
  defaultCompanyId?: string; // 初期値として設定する取引先ID
}


/**
 * 営業案件新規作成フォームコンポーネント
 */
export default function SalesOpportunityCreateForm({
  onSuccess,
  onCancel,
  defaultCompanyId,
}: SalesOpportunityCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SalesOpportunityFormData>({
    resolver: zodResolver(salesOpportunityFormSchema),
    defaultValues: {
      status: "ESTIMATING",
      companyId: defaultCompanyId || "",
    },
    shouldFocusError: false, // バリデーションエラー時の自動フォーカスを無効化
  });

  // defaultCompanyIdが変更された場合に値を設定
  useEffect(() => {
    if (defaultCompanyId) {
      setValue("companyId", defaultCompanyId, { shouldValidate: true });
    }
  }, [defaultCompanyId, setValue]);

  const onSubmit = async (data: SalesOpportunityFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/sales-opportunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          craneCount: data.craneCount ? parseInt(data.craneCount, 10) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "営業案件の作成に失敗しました"
        );
      }

      const salesOpportunity = await response.json();
      onSuccess(salesOpportunity);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "営業案件の作成に失敗しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* 取引先 */}
        <div className="sm:col-span-2">
          <LookupField
            label="取引先"
            value={watch("companyId") || ""}
            onChange={(value) => setValue("companyId", value, { shouldValidate: true })}
            apiEndpoint="/api/companies"
            displayKey="name"
            secondaryKey="address"
            itemsKey="companies"
            placeholder="例: 株式会社○○工業"
            required
            error={errors.companyId?.message}
          />
          <input
            type="hidden"
            {...register("companyId")}
          />
        </div>

        {/* 案件タイトル */}
        <div className="sm:col-span-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-900"
          >
            案件タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            {...register("title")}
            placeholder="例: ○○工場クレーン点検案件"
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

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
            <option value="ESTIMATING">見積中</option>
            <option value="WON">受注</option>
            <option value="LOST">失注</option>
          </select>
        </div>

        {/* 想定金額 */}
        <div>
          <label
            htmlFor="estimatedAmount"
            className="block text-sm font-medium text-gray-900"
          >
            想定金額
          </label>
          <input
            type="number"
            id="estimatedAmount"
            step="0.01"
            {...register("estimatedAmount")}
            placeholder="例: 1000000"
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 対象クレーン台数 */}
        <div>
          <label
            htmlFor="craneCount"
            className="block text-sm font-medium text-gray-900"
          >
            対象クレーン台数
          </label>
          <input
            type="number"
            id="craneCount"
            min="1"
            {...register("craneCount")}
            placeholder="例: 5"
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 発生日 */}
        <div>
          <label
            htmlFor="occurredAt"
            className="block text-sm font-medium text-gray-900"
          >
            発生日
          </label>
          <DatePicker
            value={watch("occurredAt") || undefined}
            onChange={(value) => setValue("occurredAt", value, { shouldValidate: true })}
            placeholder="日付を選択"
            className="mt-1"
          />
          <input
            type="hidden"
            id="occurredAt"
            {...register("occurredAt")}
          />
          {errors.occurredAt && (
            <p className="mt-1 text-sm text-red-600">
              {errors.occurredAt.message}
            </p>
          )}
        </div>

        {/* クレーン情報 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="craneInfo"
            className="block text-sm font-medium text-gray-900"
          >
            クレーン情報（型式・概要）
          </label>
          <textarea
            id="craneInfo"
            rows={3}
            {...register("craneInfo")}
            placeholder="例: トン数: 10t、作業半径: 30m"
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 備考 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-900"
          >
            備考
          </label>
          <textarea
            id="notes"
            rows={4}
            {...register("notes")}
            placeholder="例: 定期点検のため"
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* ボタン */}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
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
          {isSubmitting ? "作成中..." : "作成"}
        </button>
      </div>

    </form>
  );
}

