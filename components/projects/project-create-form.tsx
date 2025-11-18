"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
}: ProjectCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      status: "PLANNING",
    },
  });

  // 取引先とユーザー一覧を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, usersRes] = await Promise.all([
          fetch("/api/companies?limit=1000"),
          fetch("/api/users"),
        ]);

        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData.companies || []);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } catch (err) {
        console.error("データの取得に失敗しました:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
            <option value="PLANNING">計画中</option>
            <option value="IN_PROGRESS">進行中</option>
            <option value="ON_HOLD">保留</option>
            <option value="COMPLETED">完了</option>
          </select>
        </div>

        {/* 担当者 */}
        <div>
          <label
            htmlFor="assignedUserId"
            className="block text-sm font-medium text-gray-900"
          >
            担当者
          </label>
          <select
            id="assignedUserId"
            {...register("assignedUserId")}
            disabled={isLoading}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          >
            <option value="">選択してください</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>

        {/* 開始日 */}
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-900"
          >
            開始日
          </label>
          <input
            type="date"
            id="startDate"
            {...register("startDate")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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
          <input
            type="date"
            id="endDate"
            {...register("endDate")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
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

