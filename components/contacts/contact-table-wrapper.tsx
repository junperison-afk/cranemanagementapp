"use client";

import { useEffect } from "react";
import ContactTable from "./contact-table";
import { useSelectionEvent } from "@/hooks/use-selection-event";

interface Contact {
  id: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
}

interface ContactTableWrapperProps {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function ContactTableWrapper({
  contacts,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: ContactTableWrapperProps) {
  const handleSelectionChange = useSelectionEvent("contactSelectionChange");

  // データテーブルが読み込まれたことを通知
  useEffect(() => {
    // 次のフレームで実行して、DOMの更新を待つ
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("page:content:loaded"));
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [contacts, total, page, limit, skip, totalPages]);

  return (
    <ContactTable
      contacts={contacts}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
      onSelectionChange={handleSelectionChange}
    />
  );
}

