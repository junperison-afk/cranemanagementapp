"use client";

import { useState, useRef, useEffect } from "react";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface InlineEditSelectProps {
  label: string;
  value: string | boolean | null | undefined;
  onSave: (value: string | boolean) => Promise<void>;
  options: { value: string; label: string }[];
  booleanMode?: boolean;
  className?: string;
}

export default function InlineEditSelect({
  label,
  value,
  onSave,
  options,
  booleanMode = false,
  className = "",
}: InlineEditSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(
    booleanMode
      ? String(value === true)
      : value !== null && value !== undefined
      ? String(value)
      : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saveValue = booleanMode
        ? editValue === "true"
        : editValue === ""
        ? null
        : editValue;
      await onSave(saveValue as string | boolean);
      setIsEditing(false);
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(
      booleanMode
        ? String(value === true)
        : value !== null && value !== undefined
        ? String(value)
        : ""
    );
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      // Ctrl+Enterで確定
      e.preventDefault();
      handleSave();
    } else if (e.key === "Enter") {
      // Enterでも確定
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-500 mb-1">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <select
            ref={selectRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-md border border-blue-500 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors"
              title="保存"
            >
              <CheckIcon className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 hover:border-gray-400 disabled:opacity-50 flex items-center justify-center transition-colors"
              title="キャンセル"
            >
              <XMarkIcon className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayValue = booleanMode
    ? value === true
      ? "有効"
      : "無効"
    : value !== null && value !== undefined
    ? options.find((opt) => opt.value === String(value))?.label || String(value)
    : null;

  return (
    <div
      className={`group cursor-pointer ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-500">
          {label}
        </label>
        <PencilIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-1 px-3 py-2 rounded-md border border-transparent group-hover:border-gray-300 group-hover:bg-gray-50 transition-all min-h-[2.5rem] flex items-center">
        <p className="text-sm text-gray-900">
          {displayValue || <span className="text-gray-400 italic">未設定</span>}
        </p>
      </div>
    </div>
  );
}

