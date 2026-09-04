"use client";

import { useMemo, useTransition } from "react";
import { completeStepAndRepeat, toggleStepComplete } from "../curing/[id]/actions";
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
      <span
        className={`font-medium text-neutral-900 ${
          step.completed_at ? "italic line-through" : ""
        }`}
      >
        {step.label}
      </span>
      {step.due_time && (
        <p className="mt-0.5 text-neutral-500">{step.due_time}</p>
      )}
      {step.project?.name && (
        <p className="mt-0.5 text-neutral-500">{step.project.name}</p>
      )}
      {!step.completed_at && step.recurrence_interval_value && step.project ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const projectId = step.project!.id;
              startTransition(() =>
                toggleStepComplete(projectId, step.id, true),
              );
            }}
            className="rounded border border-neutral-300 px-1.5 py-0.5 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Complete
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const projectId = step.project!.id;
              startTransition(() => completeStepAndRepeat(projectId, step.id));
            }}
            className="rounded border border-blue-500 px-1.5 py-0.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            Complete &amp; repeat
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
}

function BakingStepRow({ step }: { step: DueBakingStep }) {
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`font-medium text-neutral-900 ${
              step.completed_at ? "italic line-through" : ""
            }`}
          >
            {step.label}
          </span>
          {step.project?.name && (
            <span className="text-xs text-neutral-500">
              {step.project.name}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          Due {step.due_date}
          {step.due_time && ` at ${step.due_time}`}
        </p>
      </div>
      {!step.completed_at && step.recurrence_interval_value && step.project ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const projectId = step.project!.id;
              startTransition(() =>
                toggleStepComplete(projectId, step.id, true),
              );
            }}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Complete
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const projectId = step.project!.id;
              startTransition(() => completeStepAndRepeat(projectId, step.id));
            }}
            className="rounded-md border border-blue-500 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            Complete &amp; repeat
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 text-neutral-700">
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
            className="h-4 w-4"
          />
          Complete
        </label>
      )}
    </li>
  );
}

// List-view counterpart to BakingWeeklyCalendar below — same data, same
// actions, just rows instead of a day grid. Only pending steps, matching
// how the Tasks list only shows what's not yet done (completed steps stay
// visible in the calendar view as a short-lived log, not here).
export function BakingTaskList({ steps }: { steps: DueBakingStep[] }) {
  const pending = steps
    .filter((s) => !s.completed_at)
    .slice()
    .sort(
      (a, b) =>
        a.due_date.localeCompare(b.due_date) ||
        (a.due_time ?? "").localeCompare(b.due_time ?? ""),
    );

  if (pending.length === 0) {
    return <p className="text-sm text-neutral-500">Nothing here.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
      {pending.map((step) => (
        <BakingStepRow key={step.id} step={step} />
      ))}
    </ul>
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
  wrapScroll = true,
}: {
  steps: DueBakingStep[];
  days: Date[];
  todayKey: string;
  // False when a parent already provides a shared horizontal-scroll
  // container (so this grid scrolls in sync with sibling calendars stacked
  // above it) instead of scrolling independently.
  wrapScroll?: boolean;
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
      {(() => {
        const grid = (
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
        );
        return wrapScroll ? (
          <div className="overflow-x-auto">{grid}</div>
        ) : (
          grid
        );
      })()}
    </div>
  );
}
