"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Profile, Task } from "@/lib/types";
import { Badge } from "@/components/ui";
import type { DueBakingStep } from "../curing/get-due-steps";
import { BakingTaskList, BakingWeeklyCalendar } from "./baking-weekly-calendar";
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

type PersonTasks = {
  person: { id: string; display_name: string | null };
  tasks: TaskRow[];
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
  kioskProfiles,
}: {
  items: TaskRow[];
  editableTaskIds: Set<string>;
  kioskProfiles?: Profile[];
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
              <CompleteButton taskId={task.id} kioskProfiles={kioskProfiles} />
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
  kioskProfiles,
}: {
  task: TaskRow;
  editable: boolean;
  kioskProfiles?: Profile[];
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
        <CompleteButton taskId={task.id} kioskProfiles={kioskProfiles} />
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
  kioskProfiles,
}: {
  label: string;
  tasks: TaskRow[];
  editableTaskIds: Set<string>;
  days: Date[];
  todayKey: string;
  kioskProfiles?: Profile[];
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
                        kioskProfiles={kioskProfiles}
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
          <TaskGroup
            items={undated}
            editableTaskIds={editableTaskIds}
            kioskProfiles={kioskProfiles}
          />
        </div>
      )}
    </div>
  );
}

export function TaskBoard({
  myTasks,
  otherTasks,
  editableTaskIds,
  bakingSteps,
  kioskProfiles,
  peopleTasks,
}: {
  myTasks: TaskRow[];
  otherTasks: TaskRow[];
  editableTaskIds: string[];
  bakingSteps?: DueBakingStep[];
  kioskProfiles?: Profile[];
  // Kiosk has no "logged in as" identity, so it gets one calendar/list per
  // family member instead of the "My tasks"/"Other tasks" split below.
  peopleTasks?: PersonTasks[];
}) {
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [weekOffset, setWeekOffset] = useState(0);
  const editableSet = useMemo(
    () => new Set(editableTaskIds),
    [editableTaskIds],
  );

  const todayKey = useMemo(() => dateKey(new Date()), []);
  const weekStart = useMemo(() => {
    const d = startOfWeek(new Date());
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );
  const weekRangeLabel = useMemo(() => {
    const end = days[days.length - 1];
    const start = days[0];
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `${fmt(start)} – ${fmt(end)}`;
  }, [days]);

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
          {peopleTasks ? (
            peopleTasks.map(({ person, tasks }, i) => (
              <section key={person.id} className={i > 0 ? "mt-6" : undefined}>
                <h2 className="mb-2 text-sm font-semibold text-neutral-700">
                  {person.display_name}
                </h2>
                <TaskGroup
                  items={tasks}
                  editableTaskIds={editableSet}
                  kioskProfiles={kioskProfiles}
                />
              </section>
            ))
          ) : (
            <>
              <section className="mb-6">
                <h2 className="mb-2 text-sm font-semibold text-neutral-700">
                  My tasks
                </h2>
                <TaskGroup
                  items={myTasks}
                  editableTaskIds={editableSet}
                  kioskProfiles={kioskProfiles}
                />
              </section>

              <section>
                <h2 className="mb-2 text-sm font-semibold text-neutral-700">
                  Other tasks
                </h2>
                <TaskGroup
                  items={otherTasks}
                  editableTaskIds={editableSet}
                  kioskProfiles={kioskProfiles}
                />
              </section>
            </>
          )}

          {bakingSteps && bakingSteps.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-neutral-700">
                Curing Projects
              </h2>
              <BakingTaskList steps={bakingSteps} />
            </section>
          )}
        </>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setWeekOffset((o) => o - 1)}
              aria-label="Previous week"
              className="rounded-md border border-neutral-300 p-1.5 text-neutral-700 hover:bg-neutral-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[9rem] text-center text-sm font-medium text-neutral-700">
              {weekRangeLabel}
              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="ml-2 text-xs font-normal text-accent underline"
                >
                  Today
                </button>
              )}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset((o) => o + 1)}
              aria-label="Next week"
              className="rounded-md border border-neutral-300 p-1.5 text-neutral-700 hover:bg-neutral-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {peopleTasks ? (
            peopleTasks.map(({ person, tasks }) => (
              <WeeklyCalendar
                key={person.id}
                label={person.display_name ?? "Unnamed"}
                tasks={tasks}
                editableTaskIds={editableSet}
                days={days}
                todayKey={todayKey}
                kioskProfiles={kioskProfiles}
              />
            ))
          ) : (
            <>
              <WeeklyCalendar
                label="My tasks"
                tasks={myTasks}
                editableTaskIds={editableSet}
                days={days}
                todayKey={todayKey}
                kioskProfiles={kioskProfiles}
              />
              <WeeklyCalendar
                label="Other tasks"
                tasks={otherTasks}
                editableTaskIds={editableSet}
                days={days}
                todayKey={todayKey}
                kioskProfiles={kioskProfiles}
              />
            </>
          )}
          {bakingSteps && bakingSteps.length > 0 && (
            <BakingWeeklyCalendar
              steps={bakingSteps}
              days={days}
              todayKey={todayKey}
            />
          )}
        </div>
      )}
    </div>
  );
}
