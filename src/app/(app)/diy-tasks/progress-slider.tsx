"use client";

import { useState } from "react";
import { useSave } from "@/lib/client/save";
import { setProgress } from "./actions";
import { DIY_KEYS, patchDiyTask } from "./data";

export function ProgressSlider({
  taskId,
  percent,
}: {
  taskId: string;
  percent: number;
}) {
  const save = useSave();
  // Only set while the slider is being dragged; otherwise it shows the cached
  // value, so changes made elsewhere (e.g. on a phone) show up here too.
  const [dragging, setDragging] = useState<number | null>(null);
  const value = dragging ?? percent;

  function commit() {
    if (dragging === null) return;
    const next = dragging;
    setDragging(null);
    void save(() => setProgress(taskId, next), {
      keys: [...DIY_KEYS],
      optimistic: (qc) =>
        patchDiyTask(qc, taskId, (t) => ({ ...t, percent_complete: next })),
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setDragging(Number(e.target.value))}
        onMouseUp={commit}
        onTouchEnd={commit}
        onKeyUp={commit}
        className="w-32 accent-[var(--accent)]"
      />
      <span className="w-10 text-right text-xs text-neutral-500">
        {value}%
      </span>
    </div>
  );
}
