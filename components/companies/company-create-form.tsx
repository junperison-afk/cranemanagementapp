"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

// バリデーションスキーマ
const companyFormSchema = z.object({
  name: z.string().min(1, "会社名は必須です"),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .optional()
    .or(z.literal("")),
  industryType: z.string().optional(),
  billingFlag: z.boolean().optional(),
  notes: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

interface CompanyCreateFormProps {
  onSuccess: (id: string) => void;
  onCancel: () => void;
}

/**
 * 取引先新規作成フォームコンポーネント
 */
export default function CompanyCreateForm({
  onSuccess,
  onCancel,
}: CompanyCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      billingFlag: false,
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          email: data.email || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "取引先の作成に失敗しました");
      }

      const company = await response.json();
      onSuccess(company.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取引先の作成に失敗しました");
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
        {/* 会社名 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-900"
          >
            会社名 <span className="text-red-500">*</span>
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

        {/* 郵便番号 */}
        <div>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium text-gray-900"
          >
            郵便番号
          </label>
          <input
            type="text"
            id="postalCode"
            {...register("postalCode")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 住所 */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-900"
          >
            住所
          </label>
          <input
            type="text"
            id="address"
            {...register("address")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 電話番号 */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-900"
          >
            電話番号
          </label>
          <input
            type="tel"
            id="phone"
            {...register("phone")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* メールアドレス */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-900"
          >
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            {...register("email")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* 業種 */}
        <div>
          <label
            htmlFor="industryType"
            className="block text-sm font-medium text-gray-900"
          >
            業種
          </label>
          <input
            type="text"
            id="industryType"
            {...register("industryType")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* 請求フラグ */}
        <div className="sm:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="billingFlag"
              {...register("billingFlag")}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="billingFlag"
              className="ml-2 block text-sm text-gray-900"
            >
              請求関連フラグ
            </label>
          </div>
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

