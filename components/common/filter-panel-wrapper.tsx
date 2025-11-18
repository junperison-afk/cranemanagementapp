"use client";

import { ReactNode } from "react";

interface FilterPanelWrapperProps {
  isOpen: boolean;
  children: ReactNode;
}

export default function FilterPanelWrapper({
  isOpen,
  children,
}: FilterPanelWrapperProps) {
  return (
    <div
      className={`overflow-hidden flex-shrink-0 h-full transition-all duration-300 ease-in-out ${
        isOpen ? "w-80" : "w-0"
      }`}
    >
      <div
        className={`h-full transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

