"use client";

import ProjectTable from "./project-table";
import { useSelectionEvent } from "@/hooks/use-selection-event";

interface Project {
  id: string;
  title: string;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  startDate: Date | null;
  endDate: Date | null;
  amount: number | null;
  updatedAt: Date;
  company: {
    id: string;
    name: string;
  };
  assignedUser: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  salesOpportunity: {
    id: string;
    title: string;
  } | null;
  _count: {
    equipment: number;
  };
}

interface ProjectTableWrapperProps {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function ProjectTableWrapper({
  projects,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: ProjectTableWrapperProps) {
  const handleSelectionChange = useSelectionEvent("projectSelectionChange");

  return (
    <ProjectTable
      projects={projects}
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

