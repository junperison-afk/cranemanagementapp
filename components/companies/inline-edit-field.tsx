"use client";

import { useState, useRef, useEffect } from "react";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import DatePicker from "@/components/common/date-picker";

interface InlineEditFieldProps {
  label: string;
  value: string | null | undefined;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "email" | "tel" | "textarea" | "date";
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}

export default function InlineEditField({
  label,
  value,
  onSave,
  type = "text",
  placeholder,
  multiline = false,
  className = "",
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWithValue = async (newValue: string) => {
    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      // Ctrl+Enterで確定（複数行フィールドでも使用可能）
      e.preventDefault();
      handleSave();
    } else if (e.key === "Enter" && !multiline && !e.shiftKey) {
      // 単一行フィールドの場合、Enterで確定
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
        <div className="flex items-start gap-2">
          {type === "date" ? (
            <div className="flex-1">
              <DatePicker
                value={editValue || undefined}
                onChange={(value) => {
                  setEditValue(value);
                }}
                placeholder={placeholder || "日付を選択"}
                className="border-blue-500"
              />
            </div>
          ) : multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="flex-1 rounded-md border border-blue-500 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={placeholder}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-md border border-blue-500 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={placeholder}
            />
          )}
          <div className="flex gap-2 items-center pt-1">
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
      <div className={`mt-1 px-3 py-2 rounded-md border border-transparent group-hover:border-gray-300 group-hover:bg-gray-50 transition-all min-h-[2.5rem] flex ${multiline ? 'items-start' : 'items-center'}`}>
        {multiline ? (
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {value || <span className="text-gray-400 italic">未設定</span>}
          </p>
        ) : (
          <p className="text-sm text-gray-900">
            {value || <span className="text-gray-400 italic">未設定</span>}
          </p>
        )}
      </div>
    </div>
  );
}

