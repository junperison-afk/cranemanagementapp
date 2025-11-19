"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface DatePickerProps {
  value?: string | null; // YYYY-MM-DD形式
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * 日本語カレンダーデートピッカーコンポーネント
 * 添付画像のような日本語カレンダーUIを提供します
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = "日付を選択",
  className = "",
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = value ? new Date(value) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [inputValue, setInputValue] = useState<string>(value || "");
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 日本語の月名
  const monthNames = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];

  // 日本語の曜日
  const weekDays = ["月", "火", "水", "木", "金", "土", "日"];

  // 表示用の年リスト（1950年から現在の年+10年まで）
  const currentYear = new Date().getFullYear();
  const startYear = 1950;
  const endYear = currentYear + 10;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    return startYear + i;
  });

  // カレンダーの日付を生成
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // 月曜日を0に

    const days: (Date | null)[] = [];

    // 前月の日付
    if (startingDayOfWeek > 0) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        days.push(new Date(year, month - 1, prevMonthLastDay - i));
      }
    }

    // 今月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // 来月の日付（6週間分になるように）
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  // 日付を選択
  const handleDateSelect = (date: Date) => {
    // 前月・来月の日付は選択できない
    if (
      date.getMonth() !== currentMonth.getMonth() ||
      date.getFullYear() !== currentMonth.getFullYear()
    ) {
      return;
    }

    setSelectedDate(date);
    const formattedDate = formatDate(date);
    setInputValue(formattedDate);
    onChange(formattedDate);
    setIsOpen(false);
  };

  // 日付をYYYY-MM-DD形式にフォーマット
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 表示用の日付文字列を生成
  const getDisplayValue = () => {
    // 入力中の値があればそれを優先
    if (inputValue !== "") {
      return inputValue;
    }
    if (selectedDate) {
      return formatDate(selectedDate);
    }
    return "";
  };

  // 月を変更
  const changeMonth = (delta: number) => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + delta,
        1
      )
    );
    setMonthDropdownOpen(false);
    setYearDropdownOpen(false);
  };

  // 月を選択
  const selectMonth = (month: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
    setMonthDropdownOpen(false);
  };

  // 年を選択
  const selectYear = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setYearDropdownOpen(false);
  };

  // 今日の日付に移動
  const goToToday = () => {
    const today = new Date();
    const formattedToday = formatDate(today);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
    setInputValue(formattedToday);
    onChange(formattedToday);
    setIsOpen(false);
  };

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setMonthDropdownOpen(false);
        setYearDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // valueが変更されたときにselectedDateとinputValueを更新
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setInputValue(value);
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    } else {
      setSelectedDate(null);
      setInputValue("");
    }
  }, [value]);

  const calendarDays = getCalendarDays();
  const displayedYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  // 今日の日付
  const today = new Date();
  const isToday = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 選択された日付かどうか
  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // 前月・来月の日付かどうか
  const isOtherMonth = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getMonth() !== currentMonth.getMonth() ||
      date.getFullYear() !== currentMonth.getFullYear()
    );
  };

  // 週末かどうか（土曜日=5、日曜日=6）
  const isWeekend = (date: Date | null) => {
    if (!date) return false;
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 日曜日または土曜日
  };

  // キーボード入力の処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // YYYY-MM-DD形式かどうかチェック
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(newValue)) {
      const date = new Date(newValue);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        onChange(newValue);
      }
    } else if (newValue === "") {
      setSelectedDate(null);
      onChange("");
    }
  };

  // キーボード入力でカレンダーを開く
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 入力フィールド */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={getDisplayValue()}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          className={`w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder:text-gray-400 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          } ${className.includes("border-blue-500") ? "border-blue-500" : ""}`}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
          title="カレンダーを開く"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {/* カレンダーポップアップ */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            {/* 月選択 */}
            <div className="relative">
              <button
                onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                {monthNames[currentMonthIndex]}
                <ChevronRightIcon className="h-4 w-4 ml-1 rotate-90" />
              </button>
              {monthDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                  {monthNames.map((month, index) => (
                    <button
                      key={index}
                      onClick={() => selectMonth(index)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center ${
                        index === currentMonthIndex
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-900"
                      }`}
                    >
                      {index === currentMonthIndex && (
                        <CheckIcon className="h-4 w-4 mr-2" />
                      )}
                      {month}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 年選択 */}
            <div className="relative">
              <button
                onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                {displayedYear}
                <ChevronRightIcon className="h-4 w-4 ml-1 rotate-90" />
              </button>
              {yearDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto w-20">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => selectYear(year)}
                      className={`w-full px-4 py-2 text-center text-sm hover:bg-gray-100 flex items-center justify-center ${
                        year === displayedYear
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-900"
                      }`}
                    >
                      {year === displayedYear && (
                        <CheckIcon className="h-4 w-4 mr-1" />
                      )}
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 前月/次月ボタン */}
            <div className="flex gap-1">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-1 ${
                  index >= 5 ? "text-red-600" : "text-gray-700"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) return <div key={index} />;

              const isOther = isOtherMonth(date);
              const isWeekendDay = isWeekend(date);
              const isSelectedDay = isSelected(date);
              const isTodayDay = isToday(date);

              return (
                <button
                  key={`${date.getTime()}-${index}`}
                  onClick={() => handleDateSelect(date)}
                  disabled={isOther}
                  className={`h-8 rounded text-sm transition-colors ${
                    isOther
                      ? "text-gray-300 cursor-not-allowed"
                      : isSelectedDay
                      ? "bg-blue-600 text-white font-medium"
                      : isTodayDay
                      ? "bg-blue-100 text-blue-900 font-medium"
                      : isWeekendDay
                      ? "text-red-600 hover:bg-red-50"
                      : "text-gray-900 hover:bg-gray-100"
                  } ${!isOther ? "hover:bg-opacity-80" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* 今日ボタン */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <button
              onClick={goToToday}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              今日
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

