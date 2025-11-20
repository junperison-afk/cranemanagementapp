"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  HomeIcon,
  BriefcaseIcon,
  FolderIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const menuItems = [
  { name: "ホーム", href: "/", icon: HomeIcon },
  { name: "営業案件一覧", href: "/sales-opportunities", icon: BriefcaseIcon },
  { name: "プロジェクト一覧", href: "/projects", icon: FolderIcon },
  { name: "取引先一覧", href: "/companies", icon: BuildingOfficeIcon },
  { name: "連絡先一覧", href: "/contacts", icon: UserGroupIcon },
  { name: "機器一覧", href: "/equipment", icon: WrenchScrewdriverIcon },
  { name: "作業記録一覧", href: "/work-records", icon: ClipboardDocumentCheckIcon },
];

const bottomMenuItems = [
  { name: "設定", href: "/settings", icon: Cog6ToothIcon, adminOnly: true },
  { name: "ヘルプ", href: "/help", icon: QuestionMarkCircleIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen w-60 flex-col bg-white border-r border-gray-200">
      {/* ロゴ・システム名 */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h1 className="text-lg font-bold text-gray-900">
          クレーン管理システム
        </h1>
      </div>

      {/* ユーザー情報 */}
      {session?.user && (
        <div className="px-6 py-3">
          <Link
            href="/account"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <UserCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.name || session.user.email}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.user.email}
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* メインメニュー */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* 下部メニュー */}
      <div className="border-t border-gray-200 px-3 py-4">
        <nav className="space-y-1">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            ログアウト
          </button>
        </nav>
      </div>
    </div>
  );
}

