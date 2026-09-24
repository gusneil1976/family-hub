"use client";

import { useState } from "react";
import { useSave } from "@/lib/client/save";
import { projectKey, setProjectWeightsInCache } from "../data";
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
  const save = useSave();
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
    if (parsedInitial === initialWeight && parsedTarget === targetWeight) return;
    // No waiting on the server: the cached project updates straight away and
    // is rolled back (with a toast) if the save is refused.
    void save(() => setProjectWeights(projectId, parsedInitial, parsedTarget), {
      keys: [projectKey(projectId), ["curing-projects"]],
      optimistic: (qc) =>
        setProjectWeightsInCache(qc, projectId, parsedInitial, parsedTarget),
    });
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
          onChange={(e) => setTarget(e.target.value)}
          onBlur={commit}
          className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}
