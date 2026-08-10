"use client";

import { useState, useTransition } from "react";
import { setProjectWeights } from "./actions";

export function ProjectWeights({
  projectId,
  initialWeight,
  targetWeight,
}: {
  projectId: string;
  initialWeight: number | null;
  targetWeight: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [initial, setInitial] = useState(initialWeight?.toString() ?? "");
  const [target, setTarget] = useState(targetWeight?.toString() ?? "");

  function commit() {
    const parsedInitial = initial.trim() ? Number(initial) : null;
    const parsedTarget = target.trim() ? Number(target) : null;
    if (
      (initial.trim() && !Number.isFinite(parsedInitial)) ||
      (target.trim() && !Number.isFinite(parsedTarget))
    ) {
      return;
    }
    startTransition(() =>
      setProjectWeights(projectId, parsedInitial, parsedTarget),
    );
  }

  return (
    <div className="mb-6 flex flex-wrap gap-4">
      <div>
        <label
          htmlFor="initial_weight"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Initial weight (g)
        </label>
        <input
          id="initial_weight"
          type="number"
          min={0}
          step="0.1"
          value={initial}
          disabled={pending}
          onChange={(e) => setInitial(e.target.value)}
          onBlur={commit}
          className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label
          htmlFor="target_weight"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Target weight (g)
        </label>
        <input
          id="target_weight"
          type="number"
          min={0}
          step="0.1"
          value={target}
          disabled={pending}
          onChange={(e) => setTarget(e.target.value)}
          onBlur={commit}
          className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}
