"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { Badge } from "@/components/ui";
import { CompleteButton } from "./complete-button";
import {
  formatDueDateTime,
  formatRecurrence,
  isOverdue,
  normalizeTime,
  startOfWeek,
} from "./date-utils";

type TaskRow = Task & {
  assignee: { display_name: string | null } | null;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Local date components, not toISOString() — that's UTC, which in BST
// (UTC+1) shifts local midnight back to the previous day and misaligns
// every column by one.
function dateKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function TaskGroup({
  items,
  editableTaskIds,
}: {
  items: TaskRow[];
  editableTaskIds: Set<string>;
}) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">Nothing here.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
      {items.map((task) => {
        const recurrence = formatRecurrence(
          task.recurrence_unit,
          task.recurrence_value,
        );
        const overdue = isOverdue(task.due_date, task.due_time);
        const dueLabel = formatDueDateTime(task.due_date, task.due_time);

        return (
          <li
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-neutral-900">
                  {task.title}
                </span>
                <Badge variant="accent">
                  {task.points} pt{task.points === 1 ? "" : "s"}
                </Badge>
                {!task.points_approved && (
                  <Badge variant="warning">Pending approval</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">
                {task.assignee?.display_name && (
                  <span>Assigned to {task.assignee.display_name}</span>
                )}
                {recurrence && <span> · {recurrence}</span>}
                {dueLabel && (
                  <span className={overdue ? "text-red-600" : ""}>
                    {" "}
                    · Due {dueLabel}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {editableTaskIds.has(task.id) && (
                <Link
                  href={`/house-tasks/${task.id}/edit`}
                  className="text-sm text-neutral-500 underline hover:text-neutral-900"
                >
                  Edit
                </Link>
              )}
              <CompleteButton taskId={task.id} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TaskCard({
  task,
  editable,
}: {
  task: TaskRow;
  editable: boolean;
}) {
  const overdue = isOverdue(task.due_date, task.due_time);

  return (
    <div className="rounded-md border border-card-border bg-card p-2 text-xs shadow-sm">
      <div className="flex items-start justify-between gap-1">
        <span className="font-medium text-neutral-900">{task.title}</span>
        <Badge variant="accent" className="shrink-0">
          {task.points}pt{task.points === 1 ? "" : "s"}
        </Badge>
      </div>
      <p className={`mt-0.5 ${overdue ? "text-red-600" : "text-neutral-500"}`}>
        {normalizeTime(task.due_time)}
        {task.assignee?.display_name && <> · {task.assignee.display_name}</>}
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {editable ? (
          <Link
            href={`/house-tasks/${task.id}/edit`}
            className="text-neutral-500 underline hover:text-neutral-900"
          >
            Edit
          </Link>
        ) : (
          <span />
        )}
        <CompleteButton taskId={task.id} />
      </div>
    </div>
  );
}

function WeeklyCalendar({
  label,
  tasks,
  editableTaskIds,
  days,
  todayKey,
}: {
  label: string;
  tasks: TaskRow[];
  editableTaskIds: Set<string>;
  days: Date[];
  todayKey: string;
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const day of days) map.set(dateKey(day), []);
    for (const task of tasks) {
      if (task.due_date && map.has(task.due_date)) {
        map.get(task.due_date)!.push(task);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) =>
        normalizeTime(a.due_time).localeCompare(normalizeTime(b.due_time)),
      );
    }
    return map;
  }, [days, tasks]);

  const undated = tasks.filter((t) => !t.due_date);

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">{label}</h2>
      <div className="overflow-x-auto">
        <div className="grid min-w-[770px] grid-cols-7 gap-2">
          {days.map((day, i) => {
            const key = dateKey(day);
            const isToday = key === todayKey;
            const dayTasks = byDay.get(key) ?? [];
            return (
              <div key={key}>
                <div
                  className={`mb-2 rounded-md px-2 py-1.5 text-center text-xs font-semibold ${
                    isToday
                      ? "bg-accent text-accent-foreground"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {WEEKDAY_LABELS[i]} {day.getDate()}
                </div>
                <div className="space-y-2">
                  {dayTasks.length === 0 ? (
                    <p className="px-1 text-xs text-neutral-400">—</p>
                  ) : (
                    dayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        editable={editableTaskIds.has(task.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {undated.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">
            No due date
          </h2>
          <TaskGroup items={undated} editableTaskIds={editableTaskIds} />
        </div>
      )}
    </div>
  );
}

export function TaskBoard({
  myTasks,
  otherTasks,
  editableTaskIds,
}: {
  myTasks: TaskRow[];
  otherTasks: TaskRow[];
  editableTaskIds: string[];
}) {
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const editableSet = useMemo(
    () => new Set(editableTaskIds),
    [editableTaskIds],
  );

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const todayKey = useMemo(() => dateKey(new Date()), []);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["list", "calendar"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              view === v
                ? "border-accent bg-accent text-accent-foreground"
                : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {v === "list" ? "List" : "Calendar"}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <>
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">
              My tasks
            </h2>
            <TaskGroup items={myTasks} editableTaskIds={editableSet} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">
              Other tasks
            </h2>
            <TaskGroup items={otherTasks} editableTaskIds={editableSet} />
          </section>
        </>
      ) : (
        <div className="space-y-8">
          <WeeklyCalendar
            label="My tasks"
            tasks={myTasks}
            editableTaskIds={editableSet}
            days={days}
            todayKey={todayKey}
          />
          <WeeklyCalendar
            label="Other tasks"
            tasks={otherTasks}
            editableTaskIds={editableSet}
            days={days}
            todayKey={todayKey}
          />
        </div>
      )}
    </div>
  );
}
