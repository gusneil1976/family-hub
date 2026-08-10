"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

export async function setProgress(taskId: string, percent: number) {
  const { supabase } = await requireUser();

  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  const { error } = await supabase
    .from("diy_tasks")
    .update({ percent_complete: clamped })
    .eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/diy-tasks");
}

export async function setComplete(taskId: string, completed: boolean) {
  const { supabase } = await requireUser();

  const update = completed
    ? { completed_at: new Date().toISOString(), percent_complete: 100 }
    : { completed_at: null };

  const { error } = await supabase
    .from("diy_tasks")
    .update(update)
    .eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/diy-tasks");
}
