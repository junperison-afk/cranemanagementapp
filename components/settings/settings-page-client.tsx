"use client";

import { useEffect } from "react";
import Link from "next/link";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export default function SettingsPageClient() {
  // ページコンテンツの読み込み完了を通知
  useEffect(() => {
    const event = new CustomEvent("page:content:loaded");
    window.dispatchEvent(event);
  }, []);

  const menuItems = [
    {
      name: "テンプレート管理",
      href: "/settings/templates",
      icon: DocumentTextIcon,
      description: "見積書・契約書・報告書などのテンプレートを管理します",
    },
    // 今後他の設定項目を追加
  ];

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          <p className="mt-1 text-sm text-gray-500">
            システムの各種設定を管理できます
          </p>
        </div>
      </div>

      {/* 設定メニュー */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-start gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

