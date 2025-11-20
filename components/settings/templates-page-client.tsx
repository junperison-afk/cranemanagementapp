"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TemplateList from "@/components/settings/template-list";
import TemplateUploadForm from "@/components/settings/template-upload-form";
import { DocumentTextIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function TemplatesPageClient() {
  const router = useRouter();

  // ページコンテンツの読み込み完了を通知
  useEffect(() => {
    const event = new CustomEvent("page:content:loaded");
    window.dispatchEvent(event);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center w-8 h-8 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="設定に戻る"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <DocumentTextIcon className="h-8 w-8 text-gray-900" />
              <h1 className="text-2xl font-bold text-gray-900">テンプレート管理</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              見積書・契約書・報告書などのテンプレートをアップロード・管理します
            </p>
          </div>
        </div>
      </div>

      {/* テンプレートアップロードフォーム */}
      <div className="mb-8">
        <TemplateUploadForm />
      </div>

      {/* テンプレート一覧 */}
      <div className="flex-1 min-h-0">
        <TemplateList />
      </div>
    </div>
  );
}

