"use client";

import { useMemo, useTransition } from "react";
import { toggleStepComplete } from "../curing/[id]/actions";
import type { DueBakingStep } from "../curing/get-due-steps";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function StepCard({ step }: { step: DueBakingStep }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-md border border-l-4 border-card-border border-l-blue-500 bg-card p-2 text-xs shadow-sm">
      <span className="font-medium text-neutral-900">{step.label}</span>
      {step.project?.name && (
        <p className="mt-0.5 text-neutral-500">{step.project.name}</p>
      )}
      <label className="mt-1.5 flex items-center gap-1.5 text-neutral-700">
        <input
          type="checkbox"
          checked={!!step.completed_at}
          disabled={pending || !step.project}
          onChange={(e) => {
            if (!step.project) return;
            const projectId = step.project.id;
            startTransition(() =>
              toggleStepComplete(projectId, step.id, e.target.checked),
            );
          }}
          className="h-3.5 w-3.5"
        />
        Complete
      </label>
    </div>
  );
}

// Separate from WeeklyCalendar/TaskCard in task-board.tsx — the data shape
// differs (project name + weight, not points/assignee) and it's deliberately
// styled with a blue accent instead of the pink House Tasks accent so it
// reads as a different data source at a glance.
export function BakingWeeklyCalendar({
  steps,
  days,
  todayKey,
}: {
  steps: DueBakingStep[];
  days: Date[];
  todayKey: string;
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, DueBakingStep[]>();
    for (const day of days) map.set(dateKey(day), []);
    for (const step of steps) {
      if (map.has(step.due_date)) {
        map.get(step.due_date)!.push(step);
      }
    }
    return map;
  }, [days, steps]);

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">
        Curing Projects
      </h2>
      <div className="overflow-x-auto">
        <div className="grid min-w-[770px] grid-cols-7 gap-2">
          {days.map((day, i) => {
            const key = dateKey(day);
            const isToday = key === todayKey;
            const dayItems = byDay.get(key) ?? [];
            return (
              <div key={key}>
                <div
                  className={`mb-2 rounded-md px-2 py-1.5 text-center text-xs font-semibold ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {WEEKDAY_LABELS[i]} {day.getDate()}
                </div>
                <div className="space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="px-1 text-xs text-neutral-400">—</p>
                  ) : (
                    dayItems.map((step) => (
                      <StepCard key={step.id} step={step} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
