"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DatePicker from "@/components/common/date-picker";
import LookupField from "@/components/common/lookup-field";

// バリデーションスキーマ
const projectFormSchema = z.object({
  companyId: z.string().min(1, "取引先は必須です"),
  salesOpportunityId: z.string().optional(),
  assignedUserId: z.string().optional(),
  title: z.string().min(1, "プロジェクトタイトルは必須です"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amount: z.string().optional(),
  notes: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectCreateFormProps {
  onSuccess: (id: string) => void;
  onCancel: () => void;
  defaultCompanyId?: string; // 初期値として設定する取引先ID
}

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * プロジェクト新規作成フォームコンポーネント
 */
export default function ProjectCreateForm({
  onSuccess,
  onCancel,
  defaultCompanyId,
}: ProjectCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      status: "PLANNING",
      companyId: defaultCompanyId || "",
    },
  });

  // defaultCompanyIdが設定されている場合、初期値を設定
  useEffect(() => {
    if (defaultCompanyId) {
      setValue("companyId", defaultCompanyId, { shouldValidate: true });
    }
  }, [defaultCompanyId, setValue]);

  const selectedCompanyId = watch("companyId");

  // filterParamsをメモ化して参照の変更を防ぐ
  const contactFilterParams = useMemo(
    () => (selectedCompanyId ? { companyId: selectedCompanyId } : {}),
    [selectedCompanyId]
  );

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          salesOpportunityId: data.salesOpportunityId || undefined,
          assignedUserId: data.assignedUserId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "プロジェクトの作成に失敗しました");
      }

      const project = await response.json();
      onSuccess(project.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "プロジェクトの作成に失敗しました"
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

        {/* プロジェクトタイトル */}
        <div className="sm:col-span-2">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-900"
          >
            プロジェクトタイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            {...register("title")}
            placeholder="例: ○○工場クレーン更新プロジェクト"
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
            <option value="PLANNING">計画中</option>
            <option value="IN_PROGRESS">進行中</option>
            <option value="ON_HOLD">保留</option>
            <option value="COMPLETED">完了</option>
          </select>
        </div>

        {/* 担当者 */}
        <div>
          <LookupField
            label="担当者"
            value={watch("assignedUserId") || ""}
            onChange={(value) => setValue("assignedUserId", value || undefined, { shouldValidate: true })}
            apiEndpoint="/api/contacts"
            displayKey="name"
            secondaryKey="position"
            itemsKey="contacts"
            placeholder="例: 山田 太郎"
            filterParams={contactFilterParams}
            disabled={!selectedCompanyId}
            error={errors.assignedUserId?.message}
            className={!selectedCompanyId ? "opacity-60" : ""}
          />
          <input
            type="hidden"
            {...register("assignedUserId")}
          />
        </div>

        {/* 開始日 */}
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-900"
          >
            開始日
          </label>
          <DatePicker
            value={watch("startDate") || undefined}
            onChange={(value) => setValue("startDate", value, { shouldValidate: true })}
            placeholder="日付を選択"
            className="mt-1"
          />
          <input
            type="hidden"
            id="startDate"
            {...register("startDate")}
          />
        </div>

        {/* 終了日 */}
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-900"
          >
            終了日
          </label>
          <DatePicker
            value={watch("endDate") || undefined}
            onChange={(value) => setValue("endDate", value, { shouldValidate: true })}
            placeholder="日付を選択"
            className="mt-1"
          />
          <input
            type="hidden"
            id="endDate"
            {...register("endDate")}
          />
        </div>

        {/* 金額 */}
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-900"
          >
            金額
          </label>
          <input
            type="number"
            id="amount"
            step="0.01"
            {...register("amount")}
            placeholder="例: 5000000"
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
            placeholder="例: 2024年度予算"
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

