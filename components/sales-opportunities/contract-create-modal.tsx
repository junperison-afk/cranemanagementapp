"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import ContractCreateForm from "./contract-create-form";

interface ContractCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOpportunityId: string;
  quotes: Array<{
    id: string;
    quoteNumber: string;
    amount: number;
    createdAt: string | Date;
    items?: Array<{
      id: string;
      itemNumber: number;
      description: string;
      quantity: number | null;
      unitPrice: number | null;
      amount: number;
      notes: string | null;
    }>;
  }>;
  onSuccess?: () => void;
}

/**
 * 受注書作成モーダルコンポーネント
 */
export default function ContractCreateModal({
  isOpen,
  onClose,
  salesOpportunityId,
  quotes,
  onSuccess,
}: ContractCreateModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (contract: any) => {
    setError(null);
    if (onSuccess) {
      onSuccess();
    }
    onClose();
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
            <h2 className="text-xl font-semibold text-gray-900">受注書作成</h2>
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

            <ContractCreateForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              salesOpportunityId={salesOpportunityId}
              quotes={quotes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

