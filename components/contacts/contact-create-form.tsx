"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// バリデーションスキーマ
const contactFormSchema = z.object({
  companyId: z.string().min(1, "取引先は必須です"),
  name: z.string().min(1, "氏名は必須です"),
  position: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactCreateFormProps {
  onSuccess: (id: string) => void;
  onCancel: () => void;
}

interface Company {
  id: string;
  name: string;
}

/**
 * 連絡先新規作成フォームコンポーネント
 */
export default function ContactCreateForm({
  onSuccess,
  onCancel,
}: ContactCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
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

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contacts", {
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
        throw new Error(errorData.error || "連絡先の作成に失敗しました");
      }

      const contact = await response.json();
      onSuccess(contact.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "連絡先の作成に失敗しました");
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

        {/* 氏名 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-900"
          >
            氏名 <span className="text-red-500">*</span>
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

        {/* 役職 */}
        <div>
          <label
            htmlFor="position"
            className="block text-sm font-medium text-gray-900"
          >
            役職
          </label>
          <input
            type="text"
            id="position"
            {...register("position")}
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
        <div className="sm:col-span-2">
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

