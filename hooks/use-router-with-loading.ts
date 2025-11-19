import { useRouter } from "next/navigation";
import { startLoadingBar } from "@/lib/navigation-helper";

/**
 * ローディングバー付きのルーターカスタムフック
 * router.push()をラップして、遷移前にローディングバーを表示します
 */
export function useRouterWithLoading() {
  const router = useRouter();

  return {
    ...router,
    push: (url: string, options?: Parameters<typeof router.push>[1]) => {
      startLoadingBar();
      return router.push(url, options);
    },
    replace: (url: string, options?: Parameters<typeof router.replace>[1]) => {
      startLoadingBar();
      return router.replace(url, options);
    },
  };
}

