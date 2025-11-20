"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterButton from "@/components/common/filter-button";
import FilterPanelWrapper from "@/components/common/filter-panel-wrapper";
import { EquipmentFilterPanel } from "./equipment-filters";

export function EquipmentFilterButtonWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // クライアント側の状態で即座に表示を制御
  const [localIsOpen, setLocalIsOpen] = useState(
    searchParams.get("filter") === "open"
  );

  // URLパラメータと同期
  useEffect(() => {
    setLocalIsOpen(searchParams.get("filter") === "open");
  }, [searchParams]);

  const activeFilterCount = [
    searchParams.get("search"),
    searchParams.get("model"),
    searchParams.get("serialNumber"),
    searchParams.get("location"),
    searchParams.get("updatedAfter"),
    searchParams.get("updatedBefore"),
  ].filter((v) => v).length;

  const toggleFilter = () => {
    // 即座にローカル状態を更新してUIを反応させる
    const newIsOpen = !localIsOpen;
    setLocalIsOpen(newIsOpen);

    // URLパラメータは非同期で更新（ページ全体の再レンダリングを避ける）
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newIsOpen) {
        params.set("filter", "open");
      } else {
        params.delete("filter");
      }
      router.replace(`/equipment?${params.toString()}`);
    });
  };

  return (
    <FilterButton
      onToggle={toggleFilter}
      activeFilterCount={activeFilterCount}
    />
  );
}

export function EquipmentFilterPanelWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // クライアント側の状態で即座に表示を制御
  const [localIsOpen, setLocalIsOpen] = useState(
    searchParams.get("filter") === "open"
  );

  // URLパラメータと同期
  useEffect(() => {
    setLocalIsOpen(searchParams.get("filter") === "open");
  }, [searchParams]);

  const closeFilter = () => {
    // 即座にローカル状態を更新してUIを反応させる
    setLocalIsOpen(false);

    // URLパラメータは非同期で更新
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("filter");
      router.replace(`/equipment?${params.toString()}`);
    });
  };

  return (
    <FilterPanelWrapper isOpen={localIsOpen}>
      <EquipmentFilterPanel isOpen={localIsOpen} onClose={closeFilter} />
    </FilterPanelWrapper>
  );
}

