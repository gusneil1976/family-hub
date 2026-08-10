"use client";

import { useState, useTransition } from "react";
import { setProgress } from "./actions";

export function ProgressSlider({
  taskId,
  initialPercent,
}: {
  taskId: string;
  initialPercent: number;
}) {
  const [value, setValue] = useState(initialPercent);
  const [pending, startTransition] = useTransition();

  function commit() {
    startTransition(() => setProgress(taskId, value));
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={pending}
        onChange={(e) => setValue(Number(e.target.value))}
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
