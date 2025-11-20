"use client";

import ContactTableWrapper from "@/components/contacts/contact-table-wrapper";

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

interface ContactsPageClientProps {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function ContactsPageClient({
  contacts,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: ContactsPageClientProps) {
  return (
    <ContactTableWrapper
      contacts={contacts}
      total={total}
      page={page}
      limit={limit}
      skip={skip}
      totalPages={totalPages}
      searchParams={searchParams}
    />
  );
}

