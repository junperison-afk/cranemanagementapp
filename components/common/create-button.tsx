"use client";

import { useState, useEffect } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { navigateWithLoading } from "@/lib/navigation-helper";

interface CreateButtonProps {
  /** モーダルに表示するタイトル */
  title: string;
  /** モーダル内に表示するフォームコンポーネント */
  formComponent: React.ComponentType<{
    onSuccess: (id: string) => void;
    onCancel: () => void;
  }>;
  /** リソースのパス（例: "companies", "contacts"） */
  resourcePath: string;
}

/**
 * 新規作成ボタンコンポーネント
 * クリックするとモーダルを開き、フォームを表示します
 */
export default function CreateButton({
  title,
  formComponent: FormComponent,
  resourcePath,
}: CreateButtonProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // 閲覧者の場合はボタンを表示しない
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return null;
  }

  const handleSuccess = (idOrData: string | any) => {
    // idまたはidを含むデータを受け取る（後方互換性のため）
    const id = typeof idOrData === "string" ? idOrData : idOrData?.id;
    if (id) {
      // モーダルを閉じる前にローディングバーを開始（モーダルの閉じる処理とページ遷移のタイミングを調整）
      navigateWithLoading(`/${resourcePath}/${id}`);
      // モーダルを閉じる（ページ遷移が始まるので、実際には見えなくなる）
      setIsOpen(false);
    } else {
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <PlusIcon className="h-5 w-5" />
        新規作成
      </button>

      {isOpen && (
        <CreateModal title={title} onClose={handleCancel}>
          <FormComponent onSuccess={handleSuccess} onCancel={handleCancel} />
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
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
      />

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

