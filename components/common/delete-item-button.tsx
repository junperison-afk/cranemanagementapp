"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";

interface DeleteItemButtonProps {
  /** APIエンドポイントのパス（例: "/api/companies"） */
  apiPath: string;
  /** アイテムID */
  itemId: string;
  /** リソース名（例: "取引先"） */
  resourceName: string;
  /** 削除後のリダイレクト先（例: "/companies"） */
  redirectPath: string;
  /** 削除ボタンを表示するかどうか（管理者のみなど） */
  canDelete?: boolean;
}

/**
 * 単一アイテムを削除するボタンコンポーネント
 * 詳細画面の右上に配置するための共通コンポーネント
 */
export default function DeleteItemButton({
  apiPath,
  itemId,
  resourceName,
  redirectPath,
  canDelete = true,
}: DeleteItemButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `この${resourceName}を削除しますか？この操作は取り消せません。`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${apiPath}/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      alert(`${resourceName}を削除しました。`);
      router.push(redirectPath);
    } catch (error) {
      console.error("削除エラー:", error);
      alert(`${resourceName}の削除に失敗しました。`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canDelete) {
    return null;
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
      {isDeleting ? "削除中..." : "削除"}
    </button>
  );
}

