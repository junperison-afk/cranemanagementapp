/**
 * ナビゲーション開始時にローディングバーを表示するためのヘルパー関数
 */

/**
 * ローディングバーを開始する
 */
export function startLoadingBar() {
  // カスタムイベントを発火してローディングバーを開始
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("navigation:start"));
  }
}

/**
 * window.location.hrefで遷移する前にローディングバーを開始
 */
export function navigateWithLoading(url: string) {
  startLoadingBar();
  // カスタムイベントが処理される時間を確保するため、少し遅延させる
  setTimeout(() => {
    window.location.href = url;
  }, 50);
}

