import { prisma } from "@/lib/prisma";
import ClientContactDetail from "./client-contact-detail";

interface ContactDetailContentProps {
  id: string;
  canEdit: boolean;
}

export default async function ContactDetailContent({
  id,
  canEdit,
}: ContactDetailContentProps) {
  const contact = await prisma.companyContact.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          postalCode: true,
          address: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">連絡先が見つかりません</p>
      </div>
    );
  }

  return <ClientContactDetail contact={contact} canEdit={canEdit} />;
}

