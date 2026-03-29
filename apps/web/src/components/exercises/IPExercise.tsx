import { useState } from "react";
import type { IPExerciseContent } from "@transcendence/shared";
import { Button } from "../ui/Button.js";

interface IPExerciseProps {
  content: IPExerciseContent;
  onSubmit: (positions: Array<{ itemId: string; position: number }>) => void;
  isSubmitting: boolean;
}

interface DraggableItem {
  id: string;
  label: string;
}

export function IPExercise({
  content,
  onSubmit,
  isSubmitting,
}: IPExerciseProps) {
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
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-700">{content.instruction}</p>
      </div>

      {content.zones && content.zones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.zones.map((zone, idx) => (
            <span
              key={zone.id}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
            >
              {idx + 1}. {zone.label}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Drag to reorder, or tap two items to swap them.
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
                  : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
              {idx + 1}
            </span>
            <span className="text-gray-900">{item.label}</span>
            <svg
              className="ml-auto h-4 w-4 shrink-0 text-gray-300"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M7 2a2 2 0 10 4 0 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4zM7 8a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4zM7 14a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        isLoading={isSubmitting}
        className="w-full sm:w-auto"
      >
        Submit Order
      </Button>
    </div>
  );
}
