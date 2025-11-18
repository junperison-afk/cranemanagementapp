"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  onSuccess: (id: string) => void;
  onCancel: () => void;
}

interface Company {
  id: string;
  name: string;
}

/**
 * 営業案件新規作成フォームコンポーネント
 */
export default function SalesOpportunityCreateForm({
  onSuccess,
  onCancel,
}: SalesOpportunityCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SalesOpportunityFormData>({
    resolver: zodResolver(salesOpportunityFormSchema),
    defaultValues: {
      status: "ESTIMATING",
    },
  });

  // 取引先一覧を取得
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("/api/companies?limit=1000");
        if (response.ok) {
          const data = await response.json();
          setCompanies(data.companies || []);
        }
      } catch (err) {
        console.error("取引先一覧の取得に失敗しました:", err);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

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
      onSuccess(salesOpportunity.id);
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
          <label
            htmlFor="companyId"
            className="block text-sm font-medium text-gray-900"
          >
            取引先 <span className="text-red-500">*</span>
          </label>
          <select
            id="companyId"
            {...register("companyId")}
            disabled={isLoadingCompanies}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          >
            <option value="">選択してください</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          {errors.companyId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.companyId.message}
            </p>
          )}
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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
            {...register("craneCount", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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
          <input
            type="date"
            id="occurredAt"
            {...register("occurredAt")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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

