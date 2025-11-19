"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  /** イベント名（例: "companySelectionChange"） */
  eventName: string;
  /** APIエンドポイントのパス（例: "/api/companies"） */
  apiPath: string;
  /** リソース名（例: "取引先"） */
  resourceName: string;
}

/**
 * 一括削除ボタンコンポーネント
 * 選択されたアイテムを削除するための共通コンポーネント
 */
export default function DeleteButton({
  eventName,
  apiPath,
  resourceName,
}: DeleteButtonProps) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleSelectionChange = (event: CustomEvent<{ count: number; ids: string[] }>) => {
      setSelectedCount(event.detail.count);
      setSelectedIds(event.detail.ids);
    };

    window.addEventListener(eventName as any, handleSelectionChange as EventListener);
    return () => {
      window.removeEventListener(eventName as any, handleSelectionChange as EventListener);
    };
  }, [eventName]);

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `選択した${selectedCount}件の${resourceName}を削除しますか？この操作は取り消せません。`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const deletePromises = selectedIds.map((id) =>
        fetch(`${apiPath}/${id}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0) {
        alert(`${failed}件の削除に失敗しました。`);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除中にエラーが発生しました。");
    } finally {
      setIsDeleting(false);
      // 選択をクリア
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { count: 0, ids: [] },
        })
      );
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? "削除中..." : `削除 (${selectedCount})`}
    </button>
  );
}

