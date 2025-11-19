"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { navigateWithLoading } from "@/lib/navigation-helper";
import CompanyCreateForm from "@/components/companies/company-create-form";
import ContactCreateForm from "@/components/contacts/contact-create-form";
import SalesOpportunityCreateForm from "@/components/sales-opportunities/sales-opportunity-create-form";
import ProjectCreateForm from "@/components/projects/project-create-form";

/**
 * ホーム画面のクイック作成ボタンコンポーネント
 * ダッシュボードの下に新規作成ボタンを表示します
 */
export default function QuickCreateButtons() {
  const { data: session } = useSession();
  const [openModal, setOpenModal] = useState<
    "company" | "contact" | "salesOpportunity" | "project" | null
  >(null);

  // 閲覧者の場合はボタンを表示しない
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return null;
  }

  const handleSuccess = (
    resourcePath: "companies" | "contacts" | "sales-opportunities" | "projects",
    idOrData: string | any
  ) => {
    // idまたはidを含むデータを受け取る（後方互換性のため）
    const id = typeof idOrData === "string" ? idOrData : idOrData?.id;
    if (id) {
      // モーダルを閉じる前にローディングバーを開始（モーダルの閉じる処理とページ遷移のタイミングを調整）
      navigateWithLoading(`/${resourcePath}/${id}`);
      // モーダルを閉じる（ページ遷移が始まるので、実際には見えなくなる）
      setOpenModal(null);
    } else {
      setOpenModal(null);
    }
  };

  const handleCancel = () => {
    setOpenModal(null);
  };

  return (
    <>
      {/* クイック作成ボタン */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          新規作成
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setOpenModal("company")}
            className="flex items-center justify-center gap-2 rounded-md border-2 border-gray-400 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            取引先を追加する
          </button>
          <button
            onClick={() => setOpenModal("contact")}
            className="flex items-center justify-center gap-2 rounded-md border-2 border-gray-400 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            連絡先を追加する
          </button>
          <button
            onClick={() => setOpenModal("salesOpportunity")}
            className="flex items-center justify-center gap-2 rounded-md border-2 border-gray-400 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            営業案件を追加する
          </button>
          <button
            onClick={() => setOpenModal("project")}
            className="flex items-center justify-center gap-2 rounded-md border-2 border-gray-400 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            プロジェクトを追加する
          </button>
        </div>
      </div>

      {/* 取引先作成モーダル */}
      {openModal === "company" && (
        <CreateModal
          title="取引先を新規作成"
          onClose={handleCancel}
        >
          <CompanyCreateForm
            onSuccess={(id) => handleSuccess("companies", id)}
            onCancel={handleCancel}
          />
        </CreateModal>
      )}

      {/* 連絡先作成モーダル */}
      {openModal === "contact" && (
        <CreateModal
          title="連絡先を新規作成"
          onClose={handleCancel}
        >
          <ContactCreateForm
            onSuccess={(contact) => handleSuccess("contacts", contact)}
            onCancel={handleCancel}
          />
        </CreateModal>
      )}

      {/* 営業案件作成モーダル */}
      {openModal === "salesOpportunity" && (
        <CreateModal
          title="営業案件を新規作成"
          onClose={handleCancel}
        >
          <SalesOpportunityCreateForm
            onSuccess={(salesOpportunity) =>
              handleSuccess("sales-opportunities", salesOpportunity)
            }
            onCancel={handleCancel}
          />
        </CreateModal>
      )}

      {/* プロジェクト作成モーダル */}
      {openModal === "project" && (
        <CreateModal
          title="プロジェクトを新規作成"
          onClose={handleCancel}
        >
          <ProjectCreateForm
            onSuccess={(id) => handleSuccess("projects", id)}
            onCancel={handleCancel}
          />
        </CreateModal>
      )}
    </>
  );
}

/**
 * モーダルコンポーネント
 */
interface CreateModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function CreateModal({ title, children, onClose }: CreateModalProps) {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* モーダル */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <span className="sr-only">閉じる</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* コンテンツ */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

