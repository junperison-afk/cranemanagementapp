/**
 * 選択状態の変更をグローバルイベントとして発火するカスタムフック
 * 
 * @param eventName - イベント名（例: "companySelectionChange"）
 * @returns 選択状態変更ハンドラ
 */
export function useSelectionEvent(eventName: string) {
  const handleSelectionChange = (ids: string[]) => {
    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail: { count: ids.length, ids },
      })
    );
  };

  return handleSelectionChange;
}

