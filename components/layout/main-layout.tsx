import { ReactNode } from "react";
import Sidebar from "./sidebar";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 flex flex-col p-6 overflow-hidden bg-white">{children}</div>
      </main>
    </div>
  );
}

