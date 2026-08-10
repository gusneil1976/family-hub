"use client";

import { useActionState, useState } from "react";
import type { Profile, RecurrenceUnit, Task } from "@/lib/types";
import { WhoPicker } from "@/components/who-picker";
import { normalizeTime } from "./date-utils";

export type TaskFormState = { error: string } | undefined;

type Mode = "One-off" | "Daily" | "Weekly" | "Monthly" | "Custom";

function modeFor(unit: RecurrenceUnit | null, value: number | null): Mode {
  if (!unit || !value) return "One-off";
  if (value === 1 && unit === "days") return "Daily";
  if (value === 1 && unit === "weeks") return "Weekly";
  if (value === 1 && unit === "months") return "Monthly";
  return "Custom";
}

export function TaskForm({
  action,
  profiles,
  currentUserId,
  task,
  submitLabel,
  isKiosk,
}: {
  action: (
    state: TaskFormState,
    formData: FormData,
  ) => Promise<TaskFormState>;
  profiles: Profile[];
  currentUserId: string;
  task?: Task;
  submitLabel: string;
  isKiosk?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [mode, setMode] = useState<Mode>(
    task ? modeFor(task.recurrence_unit, task.recurrence_value) : "One-off",
  );
  const [customUnit, setCustomUnit] = useState<
    Exclude<RecurrenceUnit, null>
  >(task?.recurrence_unit ?? "days");
  const [customValue, setCustomValue] = useState(
    String(task?.recurrence_value ?? 1),
  );

  let finalUnit = "";
  let finalValue = "";
  if (mode === "Daily") {
    finalUnit = "days";
    finalValue = "1";
  } else if (mode === "Weekly") {
    finalUnit = "weeks";
    finalValue = "1";
  } else if (mode === "Monthly") {
    finalUnit = "months";
    finalValue = "1";
  } else if (mode === "Custom") {
    finalUnit = customUnit;
    finalValue = customValue;
  }

  return (
    <form action={formAction} className="space-y-6">
      {isKiosk && !task && (
        <WhoPicker profiles={profiles} label="Who's creating this?" />
      )}

      <div>
        <label
          htmlFor="title"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Task
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={task?.title}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          Notes (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={task?.description ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label
            htmlFor="assigned_to"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Assign to
          </label>
          <select
            id="assigned_to"
            name="assigned_to"
            defaultValue={task?.assigned_to ?? currentUserId}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-base focus:border-accent focus:outline-none"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === currentUserId ? "Myself" : p.display_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="points"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Points
          </label>
          <input
            id="points"
            name="points"
            type="number"
            min={0}
            defaultValue={task?.points ?? 1}
            className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="due_date"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Due date (optional)
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={task?.due_date ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="due_time"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Due time (optional)
          </label>
          <input
            id="due_time"
            name="due_time"
            type="time"
            defaultValue={task?.due_time ? normalizeTime(task.due_time) : ""}
            placeholder="8:00 PM"
            className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-xs text-neutral-500">Defaults to 8:00 PM</p>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-neutral-700">
          Repeats
        </legend>
        <div className="flex flex-wrap gap-2">
          {(["One-off", "Daily", "Weekly", "Monthly", "Custom"] as Mode[]).map(
            (m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                  mode === m
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {m}
              </button>
            ),
          )}
        </div>

        {mode === "Custom" && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-neutral-700">Every</span>
            <input
              type="number"
              min={1}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="w-16 rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
            />
            <select
              value={customUnit}
              onChange={(e) =>
                setCustomUnit(e.target.value as Exclude<RecurrenceUnit, null>)
              }
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
            >
              <option value="days">days</option>
              <option value="weeks">weeks</option>
              <option value="months">months</option>
            </select>
          </div>
        )}

        <input type="hidden" name="recurrence_unit" value={finalUnit} />
        <input type="hidden" name="recurrence_value" value={finalValue} />
      </fieldset>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
