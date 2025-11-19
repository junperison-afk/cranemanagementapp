import { useState, useEffect, useRef } from "react";

/**
 * テーブルの行選択機能を提供するカスタムフック
 * 
 * @param items - 選択可能なアイテムの配列（idプロパティを持つ）
 * @param onSelectionChange - 選択状態が変更されたときのコールバック関数
 * @returns 選択状態とハンドラ関数
 */
export function useTableSelection<T extends { id: string }>(
  items: T[],
  onSelectionChange?: (selectedIds: string[]) => void
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const lastSelectedIndexRef = useRef<number | null>(null);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const shiftKeyRef = useRef<boolean>(false);

  // コールバック関数の最新版を保持
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // itemsが変更されたとき（削除後など）、存在しないIDを選択状態から削除
  useEffect(() => {
    const itemIds = new Set(items.map((item) => item.id));
    setSelectedIds((prev) => {
      const filtered = new Set(
        Array.from(prev).filter((id) => itemIds.has(id))
      );
      // 選択状態が変更された場合はコールバックを呼び出す
      if (filtered.size !== prev.size) {
        onSelectionChangeRef.current?.(Array.from(filtered));
      }
      return filtered;
    });
    // lastSelectedIndexRefもリセット
    lastSelectedIndexRef.current = null;
  }, [items]);

  // 選択状態が変更されたときにチェックボックスのindeterminate状態を更新
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate =
        selectedIds.size > 0 && selectedIds.size < items.length;
    }
  }, [selectedIds.size, items.length]);

  // 一括選択の切り替え
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(items.map((item) => item.id));
      setSelectedIds(allIds);
      onSelectionChangeRef.current?.(Array.from(allIds));
      lastSelectedIndexRef.current = items.length - 1;
    } else {
      setSelectedIds(new Set());
      onSelectionChangeRef.current?.([]);
      lastSelectedIndexRef.current = null;
    }
  };

  // クリック時にShiftキーの状態を記録
  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    shiftKeyRef.current = event.shiftKey;
  };

  // 個別選択の切り替え（Shiftキー対応）
  const handleSelectOne = (
    id: string,
    checked: boolean,
    index: number
  ) => {
    const shiftKey = shiftKeyRef.current;
    const newSelected = new Set(selectedIds);

    // Shiftキーが押されている場合、範囲選択
    if (shiftKey && lastSelectedIndexRef.current !== null) {
      const startIndex = Math.min(lastSelectedIndexRef.current, index);
      const endIndex = Math.max(lastSelectedIndexRef.current, index);

      // 範囲内のすべてのIDを選択/解除
      for (let i = startIndex; i <= endIndex; i++) {
        if (checked) {
          newSelected.add(items[i].id);
        } else {
          newSelected.delete(items[i].id);
        }
      }
    } else {
      // 通常の選択
      if (checked) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
    }

    setSelectedIds(newSelected);
    onSelectionChangeRef.current?.(Array.from(newSelected));
    lastSelectedIndexRef.current = index;
    
    // Shiftキーの状態をリセット
    shiftKeyRef.current = false;
  };

  // 全選択されているかどうか
  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < items.length;

  return {
    selectedIds,
    selectAllCheckboxRef,
    isAllSelected,
    isIndeterminate,
    handleSelectAll,
    handleSelectOne,
    handleClick,
  };
}

