/**
 * @file IPExercise — drag-and-drop ordering exercise for item positioning.
 * FR: IPExercise — exercice de positionnement par glisser-déposer pour ordonner des éléments.
 */
import { useState } from "react";
import type { IPExerciseContent } from "@transcendence/shared";
import { GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.js";

/** Props for IPExercise. / FR: Props pour IPExercise. */
interface IPExerciseProps {
  content: IPExerciseContent;
  onSubmit: (positions: Array<{ itemId: string; position: number }>) => void;
  isSubmitting: boolean;
}

interface DraggableItem {
  id: string;
  label: string;
}

/**
 * Drag-and-drop ordering interface with mobile tap-to-swap support.
 * FR: Interface de tri par glisser-déposer avec support tap-pour-échanger sur mobile.
 */
export function IPExercise({
  content,
  onSubmit,
  isSubmitting,
}: IPExerciseProps) {
  const { t } = useTranslation();
  // Shuffle items on first render
  const [orderedItems, setOrderedItems] = useState<DraggableItem[]>(() =>
    [...content.items]
      .map((item) => ({ id: item.id, label: item.label }))
      .sort(() => Math.random() - 0.5),
  );

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const moveItem = (fromIdx: number, toIdx: number) => {
    setOrderedItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== idx) {
      moveItem(draggedIdx, idx);
      setDraggedIdx(idx);
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Mobile: tap to select, tap to swap
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleTap = (idx: number) => {
    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      moveItem(selectedIdx, idx);
      setSelectedIdx(null);
    }
  };

  const handleSubmit = () => {
    const positions = orderedItems.map((item, idx) => ({
      itemId: item.id,
      position: idx,
    }));
    onSubmit(positions);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gray-50 dark:bg-warm-900 p-4">
        <p className="text-sm text-gray-700 dark:text-warm-200">{content.instruction}</p>
      </div>

      {content.zones && content.zones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.zones.map((zone, idx) => (
            <span
              key={zone.id}
              className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
            >
              {idx + 1}. {zone.label}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-warm-200">
        {t("exercise.IP.dragItems")}
      </p>

      <div className="space-y-2">
        {orderedItems.map((item, idx) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            onClick={() => handleTap(idx)}
            className={`flex cursor-grab items-center gap-3 rounded-lg border p-3 text-sm transition-colors active:cursor-grabbing ${
              selectedIdx === idx
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : draggedIdx === idx
                  ? "border-primary/40 bg-primary/5 opacity-70"
                  : "border-gray-200 dark:border-warm-700 bg-white dark:bg-warm-800 hover:border-gray-300 dark:hover:border-warm-600"
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-warm-700 text-xs font-medium text-gray-500 dark:text-warm-200">
              {idx + 1}
            </span>
            <span className="text-gray-900 dark:text-warm-50">{item.label}</span>
            <GripVertical className="ml-auto h-4 w-4 shrink-0 text-gray-300 dark:text-warm-500" />
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        isLoading={isSubmitting}
        className="w-full sm:w-auto"
      >
        {t("exercise.IP.checkPlacement")}
      </Button>
    </div>
  );
}
