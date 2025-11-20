"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import UserInfoForm from "./user-info-form";
import PasswordChangeForm from "./password-change-form";

interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

interface AccountContentProps {
  initialUser: User;
}

export default function AccountContent({ initialUser }: AccountContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [user, setUser] = useState(initialUser);

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    // セッションを更新するために再認証
    router.refresh();
  };

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">アカウント設定</h1>
        <p className="mt-1 text-sm text-gray-500">
          ユーザー情報の変更やパスワードの変更ができます
        </p>
      </div>

      {/* タブ */}
      <div className="flex-shrink-0 border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("info")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "info"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            ユーザー情報
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "password"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            パスワード変更
          </button>
        </nav>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "info" && (
          <UserInfoForm user={user} onUpdate={handleUserUpdate} />
        )}
        {activeTab === "password" && <PasswordChangeForm />}
      </div>
    </div>
  );
}

