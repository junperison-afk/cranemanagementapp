"use client";

import {
  ProjectFilterButtonWrapper,
  ProjectFilterPanelWrapper,
} from "@/components/projects/project-filters-wrapper";
import ProjectTableWrapper from "@/components/projects/project-table-wrapper";
import CreateButton from "@/components/common/create-button";
import ProjectCreateForm from "@/components/projects/project-create-form";
import DeleteButton from "@/components/common/delete-button";

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

interface ProjectsPageClientProps {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  skip: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

export default function ProjectsPageClient({
  projects,
  total,
  page,
  limit,
  skip,
  totalPages,
  searchParams,
}: ProjectsPageClientProps) {
  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">プロジェクト一覧</h1>
          <p className="mt-1 text-sm text-gray-500">
            プロジェクトの検索・管理ができます
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DeleteButton
            eventName="projectSelectionChange"
            apiPath="/api/projects"
            resourceName="プロジェクト"
          />
          <ProjectFilterButtonWrapper />
          <CreateButton
            title="プロジェクトを新規作成"
            formComponent={ProjectCreateForm}
            resourcePath="projects"
          />
        </div>
      </div>

      {/* データテーブル部分（2分割可能） */}
      <div className="flex-1 flex gap-0 min-h-0 h-full">
        {/* フィルターパネル */}
        <div>
          <ProjectFilterPanelWrapper />
        </div>

        {/* データテーブル */}
        <div className="flex-1 min-w-0">
          <ProjectTableWrapper
            projects={projects}
            total={total}
            page={page}
            limit={limit}
            skip={skip}
            totalPages={totalPages}
            searchParams={searchParams}
          />
        </div>
      </div>
    </div>
  );
}

