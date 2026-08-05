import { useState, useCallback } from "react";
import { PartInspection } from "@/types/carParts";

interface SelectionOptions {
  partsState: Record<string, PartInspection>;
  selectedPartId: string | null;
  setSelectedPartId: (id: string) => void;
  canEdit?: boolean;
  allowUndamagedParts?: boolean;
}

export function useCarSelection({
  partsState,
  selectedPartId,
  setSelectedPartId,
  canEdit = true,
  allowUndamagedParts = true,
}: SelectionOptions) {
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);

  const isPartSelectable = useCallback(
    (partId: string) => {
      if (!canEdit) return false;
      const state = partsState[partId];
      const canOpenPart = allowUndamagedParts || (state && state.tipoReparo !== "SEM_DANO");
      return Boolean(canOpenPart);
    },
    [canEdit, allowUndamagedParts, partsState]
  );

  const handleSelectPart = useCallback(
    (partId: string) => {
      if (isPartSelectable(partId)) {
        setSelectedPartId(partId);
      }
    },
    [isPartSelectable, setSelectedPartId]
  );

  const handleHoverPart = useCallback(
    (partId: string | null) => {
      setHoveredPartId(partId);
    },
    []
  );

  return {
    selectedPartId,
    hoveredPartId,
    handleSelectPart,
    handleHoverPart,
    isPartSelectable,
  };
}
