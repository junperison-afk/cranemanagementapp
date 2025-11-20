"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

interface UserInfoFormProps {
  user: User;
  onUpdate: (user: User) => void;
}

export default function UserInfoForm({ user, onUpdate }: UserInfoFormProps) {
  const { data: session } = useSession();
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ユーザーの電話番号を取得（初回のみ）
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.phone) {
            setPhone(data.phone);
          }
        })
        .catch(() => {
          // エラーは無視
        });
    }
  }, [session?.user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim(),
          phone: phone.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "更新に失敗しました");
      }

      const data = await response.json();
      setSuccess("ユーザー情報を更新しました");
      onUpdate(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        ユーザー情報の編集
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 名前 */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            名前
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="名前を入力"
          />
        </div>

        {/* メールアドレス */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="メールアドレスを入力"
          />
        </div>

        {/* 電話番号 */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            電話番号
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="電話番号を入力"
          />
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 成功メッセージ */}
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* 送信ボタン */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "更新中..." : "更新する"}
          </button>
        </div>
      </form>
    </div>
  );
}

