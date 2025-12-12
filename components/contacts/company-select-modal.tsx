"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import CompanyCreateForm from "@/components/companies/company-create-form";

interface Company {
  id: string;
  name: string;
  address: string | null;
}

interface CompanySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContactId: string;
  onSelect: (companyId: string) => Promise<void>;
}

/**
 * 取引先選択モーダルコンポーネント
 */
export default function CompanySelectModal({
  isOpen,
  onClose,
  currentContactId,
  onSelect,
}: CompanySelectModalProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // 取引先一覧を取得
  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen, searchQuery]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      params.append("limit", "50");
      params.append("page", "1");

      const response = await fetch(`/api/companies?${params.toString()}`);
      if (!response.ok) {
        throw new Error("取引先の取得に失敗しました");
      }
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error("取引先取得エラー:", error);
      alert("取引先の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (companyId: string) => {
    try {
      await onSelect(companyId);
      onClose();
    } catch (error) {
      console.error("取引先選択エラー:", error);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    router.push(`/companies/new?returnUrl=/contacts/${currentContactId}`);
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              取引先を選択
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusIcon className="h-4 w-4" />
                新規登録
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* 検索 */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="取引先名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* リスト */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">読み込み中...</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchQuery ? "検索結果が見つかりません" : "取引先が登録されていません"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelect(company.id)}
                    className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{company.name}</div>
                    {company.address && (
                      <div className="text-sm text-gray-500 mt-1">
                        {company.address}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

