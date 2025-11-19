"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import LookupField from "@/components/common/lookup-field";

// バリデーションスキーマ
const equipmentFormSchema = z.object({
  companyId: z.string().min(1, "取引先は必須です"),
  projectId: z.string().optional(),
  name: z.string().min(1, "機器名称は必須です"),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  specifications: z.string().optional(),
  notes: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

interface EquipmentCreateFormProps {
  onSuccess: (id: string) => void;
  onCancel: () => void;
}

interface Company {
  id: string;
  name: string;
}

interface Project {
  id: string;
  title: string;
  company?: {
    id: string;
    name: string;
  };
}

/**
 * 機器新規作成フォームコンポーネント
 */
export default function EquipmentCreateForm({
  onSuccess,
  onCancel,
}: EquipmentCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
  });

  const selectedCompanyId = watch("companyId");

  const onSubmit = async (data: EquipmentFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          projectId: data.projectId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "機器の作成に失敗しました");
      }

      const equipment = await response.json();
      onSuccess(equipment.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "機器の作成に失敗しました");
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
            onChange={(value) => {
              setValue("companyId", value, { shouldValidate: true });
              // 取引先が変更されたらプロジェクトをクリア
              setValue("projectId", "");
            }}
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

        {/* プロジェクト */}
        <div className="sm:col-span-2">
          <LookupField
            label="プロジェクト"
            value={watch("projectId") || ""}
            onChange={(value) => setValue("projectId", value || undefined, { shouldValidate: true })}
            apiEndpoint="/api/projects"
            displayKey="title"
            secondaryKey="company"
            itemsKey="projects"
            placeholder="例: ○○工場クレーン更新プロジェクト"
            disabled={!selectedCompanyId}
            filterParams={selectedCompanyId ? { companyId: selectedCompanyId } : {}}
            error={errors.projectId?.message}
            className={!selectedCompanyId ? "opacity-60" : ""}
          />
          <input
            type="hidden"
            {...register("projectId")}
          />
        </div>

        {/* 機器名称 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-900"
          >
            機器名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            {...register("name")}
            placeholder="例: 10tオーバーヘッドクレーン"
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* 機種・型式 */}
        <div>
          <label
            htmlFor="model"
            className="block text-sm font-medium text-gray-900"
          >
            機種・型式
          </label>
          <input
            type="text"
            id="model"
            {...register("model")}
            placeholder="例: OH-10T-30M"
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 製造番号 */}
        <div>
          <label
            htmlFor="serialNumber"
            className="block text-sm font-medium text-gray-900"
          >
            製造番号
          </label>
          <input
            type="text"
            id="serialNumber"
            {...register("serialNumber")}
            placeholder="例: SN-2024-001"
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 設置場所 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-900"
          >
            設置場所
          </label>
          <input
            type="text"
            id="location"
            {...register("location")}
            placeholder="例: 第1工場 1階"
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 仕様情報 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="specifications"
            className="block text-sm font-medium text-gray-900"
          >
            仕様情報
          </label>
          <textarea
            id="specifications"
            rows={3}
            {...register("specifications")}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
            placeholder="JSON形式で入力可能"
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
            placeholder="例: 定期メンテナンス実施中"
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

