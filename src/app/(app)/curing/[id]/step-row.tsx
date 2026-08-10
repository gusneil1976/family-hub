"use client";

import { useState, useTransition } from "react";
import type { BakingProjectStep } from "@/lib/types";
import { deleteStep, setStepWeight, toggleStepComplete } from "./actions";

export function StepRow({
  projectId,
  step,
}: {
  projectId: string;
  step: BakingProjectStep;
}) {
  const [pending, startTransition] = useTransition();
  const [weight, setWeight] = useState(step.weight?.toString() ?? "");

  function commitWeight() {
    const trimmed = weight.trim();
    const parsed = trimmed ? Number(trimmed) : null;
    if (trimmed && !Number.isFinite(parsed)) return;
    startTransition(() => setStepWeight(projectId, step.id, parsed));
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!step.completed_at}
            disabled={pending}
            onChange={(e) =>
              startTransition(() =>
                toggleStepComplete(projectId, step.id, e.target.checked),
              )
            }
            className="h-4 w-4"
          />
          <span
            className={
              step.completed_at
                ? "text-neutral-400 line-through"
                : "text-neutral-900"
            }
          >
            {step.label}
          </span>
        </label>
        <p className="mt-0.5 pl-6 text-xs text-neutral-500">
          {step.due_date}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={commitWeight}
            placeholder="g"
            className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-accent focus:outline-none"
          />
          <span className="text-xs text-neutral-500">g</span>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm("Remove this step?")) {
              startTransition(() => deleteStep(projectId, step.id));
            }
          }}
          className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-30"
        >
          Remove
        </button>
      </div>
    </li>
  );
}
