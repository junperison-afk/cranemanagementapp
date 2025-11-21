"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import ProjectCreateForm from "./project-create-form";
import { useRouter } from "next/navigation";

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCompanyId?: string;
  defaultSalesOpportunityId?: string;
  onSuccess?: () => void;
}

/**
 * プロジェクト作成モーダルコンポーネント
 */
export default function ProjectCreateModal({
  isOpen,
  onClose,
  defaultCompanyId,
  defaultSalesOpportunityId,
  onSuccess,
}: ProjectCreateModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (projectId: string) => {
    setError(null);
    if (onSuccess) {
      onSuccess();
    }
    onClose();
    // プロジェクト詳細ページに遷移
    router.push(`/projects/${projectId}`);
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* オーバーレイ */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* モーダル */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">プロジェクト作成</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <ProjectCreateForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              defaultCompanyId={defaultCompanyId}
              defaultSalesOpportunityId={defaultSalesOpportunityId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

