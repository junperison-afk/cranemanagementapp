"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
  });

  const companyId = watch("companyId");

  // 取引先とプロジェクト一覧を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, projectsRes] = await Promise.all([
          fetch("/api/companies?limit=1000"),
          fetch("/api/projects?limit=1000"),
        ]);

        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData.companies || []);
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData.projects || []);
        }
      } catch (err) {
        console.error("データの取得に失敗しました:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 取引先が変更されたらプロジェクトをフィルタリング
  useEffect(() => {
    setSelectedCompanyId(companyId || "");
  }, [companyId]);

  // 選択された取引先に関連するプロジェクトをフィルタリング
  const filteredProjects = selectedCompanyId
    ? projects.filter((p) => p.company?.id === selectedCompanyId)
    : projects;

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
          <label
            htmlFor="companyId"
            className="block text-sm font-medium text-gray-900"
          >
            取引先 <span className="text-red-500">*</span>
          </label>
          <select
            id="companyId"
            {...register("companyId")}
            disabled={isLoading}
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

        {/* プロジェクト */}
        <div className="sm:col-span-2">
          <label
            htmlFor="projectId"
            className="block text-sm font-medium text-gray-900"
          >
            プロジェクト
          </label>
          <select
            id="projectId"
            {...register("projectId")}
            disabled={isLoading || !selectedCompanyId}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          >
            <option value="">選択してください</option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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

