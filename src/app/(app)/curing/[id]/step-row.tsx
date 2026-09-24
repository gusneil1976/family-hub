"use client";

import { useState } from "react";
import type { BakingProjectStep } from "@/lib/types";
import { useSave } from "@/lib/client/save";
import {
  deleteStepInCache,
  isDraftStep,
  repeatStepInCache,
  setStepWeightInCache,
  stepKeys,
  toggleStepInCache,
} from "../data";
import {
  completeStepAndRepeat,
  deleteStep,
  setStepWeight,
  toggleStepComplete,
} from "./actions";

export function StepRow({
  projectId,
  step,
}: {
  projectId: string;
  step: BakingProjectStep;
}) {
  const save = useSave();
  const [weight, setWeight] = useState(step.weight?.toString() ?? "");
  // A row that was only just added on this screen (e.g. the next repeat)
  // has no real id until the re-sync lands a moment later.
  const draft = isDraftStep(step.id);
  const keys = stepKeys(projectId);

  function toggle(completed: boolean) {
    void save(() => toggleStepComplete(projectId, step.id, completed), {
      keys,
      optimistic: (qc) => toggleStepInCache(qc, projectId, step.id, completed),
    });
  }

  function commitWeight() {
    const trimmed = weight.trim();
    const parsed = trimmed ? Number(trimmed) : null;
    if (trimmed && !Number.isFinite(parsed)) return;
    if (parsed === step.weight || draft) return;
    void save(() => setStepWeight(projectId, step.id, parsed), {
      keys,
      optimistic: (qc) => setStepWeightInCache(qc, projectId, step.id, parsed),
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
      <div>
        {!step.completed_at && step.recurrence_interval_value ? (
          <div>
            <span className="text-neutral-900">{step.label}</span>
            <span className="ml-2 text-xs text-neutral-400">
              repeats every {step.recurrence_interval_value}{" "}
              {step.recurrence_interval_unit}
            </span>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                disabled={draft}
                onClick={() => toggle(true)}
                className="rounded-md border border-neutral-300 px-2 py-0.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Complete
              </button>
              <button
                type="button"
                disabled={draft}
                onClick={() =>
                  void save(() => completeStepAndRepeat(projectId, step.id), {
                    keys,
                    optimistic: (qc) => repeatStepInCache(qc, projectId, step.id),
                  })
                }
                className="rounded-md border border-accent px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
              >
                Complete &amp; repeat
              </button>
            </div>
          </div>
        ) : (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!step.completed_at}
              disabled={draft}
              onChange={(e) => toggle(e.target.checked)}
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
        )}
        <p
          className={`mt-0.5 text-xs text-neutral-500 ${
            !step.completed_at && step.recurrence_interval_value ? "" : "pl-6"
          }`}
        >
          {step.due_date}
          {step.due_time && ` at ${step.due_time}`}
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
          disabled={draft}
          onClick={() => {
            if (confirm("Remove this step?")) {
              void save(() => deleteStep(projectId, step.id), {
                keys,
                optimistic: (qc) => deleteStepInCache(qc, projectId, step.id),
              });
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
