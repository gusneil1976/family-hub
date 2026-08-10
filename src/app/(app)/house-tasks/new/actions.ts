"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { RecurrenceUnit } from "@/lib/types";

type ActionState = { error: string } | undefined;

export async function createTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, user, profile } = await requireUser();

  const performedBy = String(formData.get("performed_by") ?? "").trim();
  const createdBy = profile?.is_kiosk && performedBy ? performedBy : user.id;
  if (profile?.is_kiosk && !performedBy) {
    return { error: "Please select who's creating this." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Title is required." };
  }

  const points = Number(formData.get("points") ?? 1);
  if (!Number.isFinite(points) || points < 0) {
    return { error: "Points can't be negative." };
  }

  const assignedTo =
    String(formData.get("assigned_to") ?? "").trim() || createdBy;
  const dueDate = String(formData.get("due_date") ?? "").trim() || null;
  const dueTime = String(formData.get("due_time") ?? "").trim() || null;
  const description =
    String(formData.get("description") ?? "").trim() || null;

  const recurrenceUnitRaw = String(formData.get("recurrence_unit") ?? "");
  const recurrenceUnit: RecurrenceUnit | null =
    recurrenceUnitRaw === "days" ||
    recurrenceUnitRaw === "weeks" ||
    recurrenceUnitRaw === "months"
      ? recurrenceUnitRaw
      : null;
  const recurrenceValueRaw = formData.get("recurrence_value");
  const recurrenceValue =
    recurrenceUnit && recurrenceValueRaw ? Number(recurrenceValueRaw) : null;

  const { error } = await supabase.from("tasks").insert({
    title,
    description,
    points,
    created_by: createdBy,
    assigned_to: assignedTo,
    due_date: dueDate,
    due_time: dueTime,
    recurrence_unit: recurrenceUnit,
    recurrence_value: recurrenceValue,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/house-tasks");
}
