"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, PrinterIcon } from "@heroicons/react/24/outline";
import QuoteEditForm from "./quote-edit-form";
import QuoteTemplateSelector from "./quote-template-selector";

interface Quote {
  id: string;
  quoteNumber: string;
  amount: number;
  conditions: string | null;
  status: string;
  validUntil: Date | null;
  notes: string | null;
  items: Array<{
    id: string;
    itemNumber: number;
    description: string;
    quantity: number | null;
    unitPrice: number | null;
    amount: number;
    notes: string | null;
  }>;
}

interface QuoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOpportunityId: string;
  quoteId: string;
  onSuccess?: () => void;
}

const statusLabels: Record<string, string> = {
  DRAFT: "下書き",
  SENT: "送信済み",
  ACCEPTED: "承認済み",
  REJECTED: "却下",
};

/**
 * 見積詳細モーダルコンポーネント
 */
export default function QuoteDetailModal({
  isOpen,
  onClose,
  salesOpportunityId,
  quoteId,
  onSuccess,
}: QuoteDetailModalProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isQuoteTemplateModalOpen, setIsQuoteTemplateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 見積データを取得
  useEffect(() => {
    if (isOpen && quoteId) {
      fetchQuote();
    }
  }, [isOpen, quoteId]);

  const fetchQuote = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/sales-opportunities/${salesOpportunityId}/quotes/${quoteId}`
      );
      if (!response.ok) {
        throw new Error("見積の取得に失敗しました");
      }
      const data = await response.json();
      setQuote(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "見積の取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSuccess = (updatedQuote: Quote) => {
    setQuote(updatedQuote);
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

  if (!isOpen) return null;

  return (
    <>
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
                  {isEditing ? "見積編集" : "見積詳細"}
                </h2>
                {quote && (
                  <p className="mt-1 text-sm text-gray-500">
                    見積番号: {quote.quoteNumber}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {quote && !isEditing && (
                  <>
                    <button
                      onClick={() => setIsQuoteTemplateModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      <PrinterIcon className="h-4 w-4" />
                      見積書印刷
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
                  <p className="text-gray-500">見積を読み込み中...</p>
                </div>
              ) : !quote ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">見積が見つかりません</p>
                </div>
              ) : isEditing ? (
                <QuoteEditForm
                  quote={quote}
                  onSuccess={handleEditSuccess}
                  onCancel={() => setIsEditing(false)}
                  salesOpportunityId={salesOpportunityId}
                />
              ) : (
                <div className="space-y-6">
                  {/* 基本情報 */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        ステータス
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {statusLabels[quote.status] || quote.status}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        合計金額
                      </label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        ¥{quote.amount.toLocaleString("ja-JP")}
                      </p>
                    </div>
                    {quote.validUntil && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          有効期限
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(quote.validUntil).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                    )}
                    {quote.conditions && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-500">
                          条件
                        </label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                          {quote.conditions}
                        </p>
                      </div>
                    )}
                    {quote.notes && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-500">
                          備考
                        </label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                          {quote.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 見積明細 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">見積明細</h3>
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
                            {quote.items.some((item) => item.notes) && (
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                備考
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {quote.items.map((item) => (
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
                              {quote.items.some((item) => item.notes) && (
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
                                quote.items.some((item) => item.notes) ? 5 : 4
                              }
                              className="px-4 py-3 text-right text-sm font-medium text-gray-900"
                            >
                              合計金額
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                              ¥{quote.amount.toLocaleString("ja-JP")}
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
      </div>

      {/* 見積書作成モーダル */}
      {quote && (
        <QuoteTemplateSelector
          isOpen={isQuoteTemplateModalOpen}
          onClose={() => setIsQuoteTemplateModalOpen(false)}
          salesOpportunityId={salesOpportunityId}
          quoteId={quote.id}
          onSuccess={() => {
            setIsQuoteTemplateModalOpen(false);
            if (onSuccess) {
              onSuccess();
            }
          }}
        />
      )}
    </>
  );
}

