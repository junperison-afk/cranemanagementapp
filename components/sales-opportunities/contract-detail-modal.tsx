"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, PrinterIcon } from "@heroicons/react/24/outline";
import ContractEditForm from "./contract-edit-form";
import ContractTemplateSelector from "./contract-template-selector";

interface Contract {
  id: string;
  contractNumber: string;
  contractDate: Date | string;
  amount: number;
  conditions: string | null;
  status: string;
  items: Array<{
    id: string;
    itemNumber: number;
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    amount: number;
    notes: string | null;
  }>;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOpportunityId: string;
  contractId: string;
  onSuccess?: () => void;
}

/**
 * 受注書詳細モーダルコンポーネント
 */
export default function ContractDetailModal({
  isOpen,
  onClose,
  salesOpportunityId,
  contractId,
  onSuccess,
}: ContractDetailModalProps) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isContractTemplateModalOpen, setIsContractTemplateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 受注書データを取得
  useEffect(() => {
    if (isOpen && contractId) {
      fetchContract();
    }
  }, [isOpen, contractId]);

  const fetchContract = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/sales-opportunities/${salesOpportunityId}/contracts/${contractId}`
      );
      if (!response.ok) {
        throw new Error("受注書の取得に失敗しました");
      }
      const data = await response.json();
      setContract(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "受注書の取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSuccess = (updatedContract: Contract) => {
    setContract(updatedContract);
    setIsEditing(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setError(null);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* オーバーレイ */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* モーダル */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? "受注書編集" : "受注書詳細"}
              </h2>
              {contract && (
                <p className="mt-1 text-sm text-gray-500">
                  契約番号: {contract.contractNumber}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {contract && !isEditing && (
                <>
                  <button
                    onClick={() => setIsContractTemplateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    <PrinterIcon className="h-4 w-4" />
                    受注書印刷
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    編集
                  </button>
                </>
              )}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">受注書を読み込み中...</p>
              </div>
            ) : !contract ? (
              <div className="text-center py-8">
                <p className="text-gray-500">受注書が見つかりません</p>
              </div>
            ) : isEditing ? (
              <ContractEditForm
                contract={contract}
                onSuccess={handleEditSuccess}
                onCancel={() => setIsEditing(false)}
                salesOpportunityId={salesOpportunityId}
              />
            ) : (
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      契約日
                    </label>
                    <p className="mt-1 text-sm text-gray-900 text-center">
                      {new Date(contract.contractDate).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      契約番号
                    </label>
                    <p className="mt-1 text-sm text-gray-900 text-center">
                      {contract.contractNumber}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      金額
                    </label>
                    <p className="mt-1 text-lg font-semibold text-gray-900 text-center">
                      ¥{contract.amount.toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      ステータス
                    </label>
                    <p className="mt-1 text-sm text-gray-900 text-center">
                      {contract.status === "DRAFT" && "下書き"}
                      {contract.status === "CONFIRMED" && "確定"}
                      {contract.status === "CANCELLED" && "キャンセル"}
                      {!["DRAFT", "CONFIRMED", "CANCELLED"].includes(contract.status) && (contract.status || "-")}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      作成者
                    </label>
                    <p className="mt-1 text-sm text-gray-900 text-center">
                      {contract.createdBy?.name || contract.createdBy?.email || "-"}
                    </p>
                  </div>
                </div>

                {contract.conditions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      契約条件
                    </label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {contract.conditions}
                    </p>
                  </div>
                )}

                {/* 受注明細 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">受注明細</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            明細番号
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            明細内容
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            数量
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            単価
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            金額
                          </th>
                          {contract.items.some((item) => item.notes) && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              備考
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contract.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {item.itemNumber}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                              {item.quantity !== null ? item.quantity.toLocaleString("ja-JP") : "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                              {item.unitPrice !== null
                                ? `¥${item.unitPrice.toLocaleString("ja-JP")}`
                                : "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              ¥{item.amount.toLocaleString("ja-JP")}
                            </td>
                            {contract.items.some((item) => item.notes) && (
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {item.notes || "-"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={
                              contract.items.some((item) => item.notes) ? 5 : 4
                            }
                            className="px-4 py-3 text-right text-sm font-medium text-gray-900"
                          >
                            合計金額
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                            ¥{contract.amount.toLocaleString("ja-JP")}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 受注書作成モーダル */}
      {contract && (
        <ContractTemplateSelector
          isOpen={isContractTemplateModalOpen}
          onClose={() => setIsContractTemplateModalOpen(false)}
          salesOpportunityId={salesOpportunityId}
          contractId={contract.id}
          onSuccess={() => {
            setIsContractTemplateModalOpen(false);
            if (onSuccess) {
              onSuccess();
            }
          }}
        />
      )}
    </div>
  );
}

