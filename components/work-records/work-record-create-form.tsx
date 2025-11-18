"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// バリデーションスキーマ
const workRecordFormSchema = z.object({
  equipmentId: z.string().min(1, "機器は必須です"),
  userId: z.string().min(1, "担当者は必須です"),
  workType: z.enum(["INSPECTION", "REPAIR", "MAINTENANCE", "OTHER"]).optional(),
  inspectionDate: z.string().min(1, "作業日は必須です"),
  overallJudgment: z.enum(["GOOD", "CAUTION", "BAD", "REPAIR"]).optional(),
  findings: z.string().optional(),
  summary: z.string().optional(),
  additionalNotes: z.string().optional(),
  checklistData: z.string().optional(),
  photos: z.string().optional(),
});

type WorkRecordFormData = z.infer<typeof workRecordFormSchema>;

interface WorkRecordCreateFormProps {
  onSuccess: (id: string) => void;
  onCancel: () => void;
}

interface Equipment {
  id: string;
  name: string;
  model: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * 作業記録新規作成フォームコンポーネント
 */
export default function WorkRecordCreateForm({
  onSuccess,
  onCancel,
}: WorkRecordCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkRecordFormData>({
    resolver: zodResolver(workRecordFormSchema),
    defaultValues: {
      workType: "INSPECTION",
    },
  });

  // 機器とユーザー一覧を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equipmentRes, usersRes] = await Promise.all([
          fetch("/api/equipment?limit=1000"),
          fetch("/api/users"),
        ]);

        if (equipmentRes.ok) {
          const equipmentData = await equipmentRes.json();
          setEquipment(equipmentData.equipment || []);
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

  const onSubmit = async (data: WorkRecordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/work-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          overallJudgment: data.overallJudgment || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "作業記録の作成に失敗しました");
      }

      const workRecord = await response.json();
      onSuccess(workRecord.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "作業記録の作成に失敗しました"
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
        {/* 機器 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="equipmentId"
            className="block text-sm font-medium text-gray-900"
          >
            機器 <span className="text-red-500">*</span>
          </label>
          <select
            id="equipmentId"
            {...register("equipmentId")}
            disabled={isLoading}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          >
            <option value="">選択してください</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} {eq.model ? `(${eq.model})` : ""}
              </option>
            ))}
          </select>
          {errors.equipmentId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.equipmentId.message}
            </p>
          )}
        </div>

        {/* 担当者 */}
        <div>
          <label
            htmlFor="userId"
            className="block text-sm font-medium text-gray-900"
          >
            担当者 <span className="text-red-500">*</span>
          </label>
          <select
            id="userId"
            {...register("userId")}
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
          {errors.userId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.userId.message}
            </p>
          )}
        </div>

        {/* 作業タイプ */}
        <div>
          <label
            htmlFor="workType"
            className="block text-sm font-medium text-gray-900"
          >
            作業タイプ
          </label>
          <select
            id="workType"
            {...register("workType")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          >
            <option value="INSPECTION">点検</option>
            <option value="REPAIR">修理</option>
            <option value="MAINTENANCE">メンテナンス</option>
            <option value="OTHER">その他</option>
          </select>
        </div>

        {/* 作業日 */}
        <div>
          <label
            htmlFor="inspectionDate"
            className="block text-sm font-medium text-gray-900"
          >
            作業日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="inspectionDate"
            {...register("inspectionDate")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
          {errors.inspectionDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.inspectionDate.message}
            </p>
          )}
        </div>

        {/* 総合判定 */}
        <div>
          <label
            htmlFor="overallJudgment"
            className="block text-sm font-medium text-gray-900"
          >
            総合判定
          </label>
          <select
            id="overallJudgment"
            {...register("overallJudgment")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          >
            <option value="">選択してください</option>
            <option value="GOOD">良好</option>
            <option value="CAUTION">注意</option>
            <option value="BAD">不良</option>
            <option value="REPAIR">要修理</option>
          </select>
        </div>

        {/* 所見 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="findings"
            className="block text-sm font-medium text-gray-900"
          >
            所見
          </label>
          <textarea
            id="findings"
            rows={3}
            {...register("findings")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 結果サマリ */}
        <div className="sm:col-span-2">
          <label
            htmlFor="summary"
            className="block text-sm font-medium text-gray-900"
          >
            結果サマリ
          </label>
          <textarea
            id="summary"
            rows={3}
            {...register("summary")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 追加項目メモ */}
        <div className="sm:col-span-2">
          <label
            htmlFor="additionalNotes"
            className="block text-sm font-medium text-gray-900"
          >
            追加項目メモ
          </label>
          <textarea
            id="additionalNotes"
            rows={3}
            {...register("additionalNotes")}
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

