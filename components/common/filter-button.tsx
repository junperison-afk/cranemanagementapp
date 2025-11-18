"use client";

import { FunnelIcon } from "@heroicons/react/24/outline";

interface FilterButtonProps {
  onToggle: () => void;
  activeFilterCount: number;
}

export default function FilterButton({
  onToggle,
  activeFilterCount,
}: FilterButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <FunnelIcon className="h-5 w-5" />
      フィルター
      {activeFilterCount > 0 && (
        <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}

