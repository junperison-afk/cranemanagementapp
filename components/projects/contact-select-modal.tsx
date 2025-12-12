"use client";

import { useState, useEffect, useCallback } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebounce } from "@/hooks/use-debounce";
import ContactCreateForm from "@/components/contacts/contact-create-form";

interface Contact {
  id: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  company: {
    id: string;
    name: string;
  };
}

interface ContactSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contactId: string) => Promise<void>;
  companyId: string;
}

/**
 * 連絡先選択モーダルコンポーネント
 * 指定された会社で登録されている連絡先の一覧から選択できます
 */
export default function ContactSelectModal({
  isOpen,
  onClose,
  onSelect,
  companyId,
}: ContactSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 検索クエリのデバウンス（500ms）
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // 連絡先検索
  const searchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        companyId: companyId,
      });

      if (debouncedSearchQuery) {
        params.set("search", debouncedSearchQuery);
      }

      const response = await fetch(`/api/contacts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("連絡先検索エラー:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, page, limit, companyId]);

  // 検索クエリまたはページが変更されたら検索
  useEffect(() => {
    if (isOpen) {
      searchContacts();
    }
  }, [isOpen, debouncedSearchQuery, page, searchContacts]);

  // モーダルを開いたときに検索クエリと選択状態をリセット
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setPage(1);
      setSelectedContactId(null);
    }
  }, [isOpen]);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // 決定ボタンを押したときの処理
  const handleConfirm = async () => {
    if (!selectedContactId) return;

    setIsLinking(true);
    try {
      await onSelect(selectedContactId);
      onClose();
    } catch (error) {
      console.error("連絡先関連付けエラー:", error);
      alert("連絡先の関連付けに失敗しました");
    } finally {
      setIsLinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-3xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              連絡先を選択
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                新規登録
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedContactId || isLinking}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLinking ? "関連付け中..." : "決定"}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <span className="sr-only">閉じる</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* 検索フィールド */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="氏名、役職、電話、メールで検索..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // 検索時にページをリセット
                }}
                className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* 検索結果 */}
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">検索中...</div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">
                  {searchQuery
                    ? "検索結果が見つかりませんでした"
                    : "この会社に登録されている連絡先がありません"}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {total}件の連絡先が見つかりました
                </div>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          氏名
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          役職
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          電話
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          メール
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contacts.map((contact) => (
                        <tr
                          key={contact.id}
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                            selectedContactId === contact.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => setSelectedContactId(contact.id)}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="radio"
                              name="contact"
                              checked={selectedContactId === contact.id}
                              onChange={() => setSelectedContactId(contact.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {contact.position || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {contact.phone || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {contact.email || "-"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ページネーション */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      前へ
                    </button>
                    <div className="text-sm text-gray-700">
                      {page} / {totalPages} ページ
                    </div>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 連絡先作成モーダル */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* オーバーレイ */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsCreateModalOpen(false)}
            />

            {/* モーダル */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* ヘッダー */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">連絡先を新規作成</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  <span className="sr-only">閉じる</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* コンテンツ */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <ContactCreateForm
                  defaultCompanyId={companyId}
                  onSuccess={async (contact) => {
                    // 連絡先作成後、一覧を再取得
                    await searchContacts();
                    setIsCreateModalOpen(false);
                    // 作成した連絡先を自動選択
                    setSelectedContactId(contact.id);
                  }}
                  onCancel={() => setIsCreateModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

