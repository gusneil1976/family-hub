"use server";

import { revalidatePath } from "next/cache";
import { requireHouseTasksAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionState = { error: string } | undefined;

// Uses the admin client because migration 0007 revokes column-level UPDATE
// on tasks.points/points_approved from the authenticated role — only this
// action (gated by requireHouseTasksAdmin) can set them.
export async function approveTaskPoints(
  taskId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireHouseTasksAdmin();

  const points = Number(formData.get("points"));
  if (!Number.isFinite(points) || points < 1) {
    return { error: "Points must be a positive number." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("tasks")
    .update({ points, points_approved: true })
    .eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/house-tasks/admin/approvals");
  revalidatePath("/house-tasks");
  revalidatePath("/house-tasks/completed");
  revalidatePath("/house-tasks/scoreboard");
}
