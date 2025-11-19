"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface LookupItem {
  id: string;
  [key: string]: any; // その他の任意のプロパティ
}

interface LookupFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  apiEndpoint: string; // APIエンドポイント（例: "/api/companies"）
  searchKey?: string; // 検索パラメータのキー（デフォルト: "search"）
  displayKey?: string; // 表示するプロパティのキー（デフォルト: "name"）
  secondaryKey?: string; // サブ表示するプロパティのキー（例: "address"）
  itemsKey?: string; // APIレスポンス内のアイテム配列のキー（デフォルト: "companies"）
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  filterParams?: Record<string, string>; // 追加のフィルターパラメータ（例: { companyId: "xxx" }）
  className?: string;
  error?: string;
}

/**
 * 汎用的なルックアップフィールドコンポーネント
 * リアルタイム検索とドロップダウンで候補を選択できます
 */
export default function LookupField({
  label,
  value,
  onChange,
  apiEndpoint,
  searchKey = "search",
  displayKey = "name",
  secondaryKey,
  itemsKey,
  placeholder,
  required = false,
  disabled = false,
  filterParams = {},
  className = "",
  error,
}: LookupFieldProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LookupItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedItem, setSelectedItem] = useState<LookupItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // filterParamsをJSON文字列化して比較（参照の変更を防ぐ）
  const filterParamsString = useMemo(() => JSON.stringify(filterParams), [filterParams]);

  // アイテムを検索
  useEffect(() => {
    const searchItems = async () => {
      if (!isDropdownOpen) return;

      try {
        const params = new URLSearchParams();
        if (debouncedSearchQuery) {
          params.set(searchKey, debouncedSearchQuery);
        }
        params.set("limit", "10");

        // 追加のフィルターパラメータを追加
        const filterParamsObj = JSON.parse(filterParamsString);
        Object.entries(filterParamsObj).forEach(([key, val]) => {
          if (val) {
            params.set(key, val);
          }
        });

        const response = await fetch(`${apiEndpoint}?${params.toString()}`);
        if (!response.ok) throw new Error("検索に失敗しました");

        const data = await response.json();
        
        // itemsKeyが指定されている場合はそれを使用、否则は自動検出
        let items: LookupItem[] = [];
        if (itemsKey) {
          items = data[itemsKey] || [];
        } else {
          // よくあるキー名を試す
          items = data.companies || data.projects || data.salesOpportunities || data.users || data.equipment || data.contacts || [];
        }
        
        setSearchResults(items);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("検索エラー:", error);
        setSearchResults([]);
      }
    };

    searchItems();
  }, [debouncedSearchQuery, isDropdownOpen, apiEndpoint, searchKey, filterParamsString, itemsKey]);

  // valueが変更されたときに選択アイテムを更新
  useEffect(() => {
    // 既に選択されているアイテムがあり、valueが一致する場合は何もしない
    if (value && selectedItem && selectedItem.id === value) {
      return;
    }

    // valueが設定されているが選択アイテムがない、またはvalueが変わった場合
    if (value) {
      // valueが設定されているが選択アイテムがない場合、検索して設定
      const findItem = async () => {
        try {
          const params = new URLSearchParams();
          params.set("limit", "1000");
          
          // filterParamsも考慮して検索
          const filterParamsObj = JSON.parse(filterParamsString || "{}");
          Object.entries(filterParamsObj).forEach(([key, val]) => {
            if (val) {
              params.set(key, val);
            }
          });

          const response = await fetch(`${apiEndpoint}?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            let items: LookupItem[] = [];
            if (itemsKey) {
              items = data[itemsKey] || [];
            } else {
              items = data.companies || data.projects || data.salesOpportunities || data.users || data.equipment || data.contacts || [];
            }
            const found = items.find((item: LookupItem) => item.id === value);
            if (found) {
              setSelectedItem(found);
              const displayValue = found[displayKey] || "";
              // searchQueryを更新する前に、現在の値と比較
              setSearchQuery((prev) => prev !== displayValue ? displayValue : prev);
            } else {
              // 見つからなかった場合もクリア
              setSelectedItem(null);
              setSearchQuery("");
            }
          }
        } catch (error) {
          console.error("アイテム取得エラー:", error);
        }
      };
      findItem();
    } else {
      // valueが空の場合はクリア
      setSelectedItem(null);
      setSearchQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, apiEndpoint, displayKey, itemsKey, filterParamsString]);

  // アイテムを選択したときの処理
  const handleItemSelect = (item: LookupItem) => {
    setSelectedItem(item);
    setSearchQuery(item[displayKey] || "");
    onChange(item.id);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
  };

  // 入力フィールドのフォーカス処理
  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  // 入力フィールドの変更処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setIsDropdownOpen(true);

    // 選択が解除された場合
    if (selectedItem && newValue !== selectedItem[displayKey]) {
      setSelectedItem(null);
      onChange("");
    }
  };

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // キーボードナビゲーション
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleItemSelect(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className={className} ref={containerRef}>
      <label
        htmlFor={label}
        className="block text-sm font-medium text-gray-900"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1 relative">
        <input
          ref={inputRef}
          type="text"
          id={label}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {/* 候補ドロップダウン */}
        {isDropdownOpen && !disabled && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {searchResults.length > 0 ? (
              <ul className="py-1">
                {searchResults.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleItemSelect(item)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                        index === selectedIndex
                          ? "bg-blue-50 text-blue-900"
                          : "text-gray-900"
                      }`}
                    >
                      <div className="font-medium">{item[displayKey]}</div>
                      {secondaryKey && item[secondaryKey] && (
                        <div className="text-xs text-gray-500">
                          {typeof item[secondaryKey] === "object" && item[secondaryKey] !== null
                            ? item[secondaryKey].name || item[secondaryKey].title || item[secondaryKey][displayKey] || JSON.stringify(item[secondaryKey])
                            : item[secondaryKey]}
                        </div>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 text-center">
                {debouncedSearchQuery ? "該当する項目が見つかりません" : "検索結果を表示します"}
              </div>
            )}
          </div>
        )}
      </div>
      {/* 隠しフィールドで値を保持 */}
      <input type="hidden" value={value} />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

