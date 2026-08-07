import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createResendClient, REMINDER_FROM_ADDRESS } from "@/lib/resend";
import type { Task } from "@/lib/types";

// Triggered by a scheduled GitHub Actions workflow (not Vercel Cron — the
// free Hobby plan limits that to once a day, too coarse for a due-time
// check). Protected by CRON_SECRET so only that workflow can call it.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: candidates, error } = await admin
    .from("tasks")
    .select("*")
    .eq("is_active", true)
    .is("completed_at", null)
    .is("reminder_sent_at", null)
    .not("due_date", "is", null)
    .returns<Task[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // due_date/due_time are separate columns, so "is it overdue" is computed
  // in JS with the same 8pm fallback used everywhere else in the app
  // (src/app/(app)/house-tasks/date-utils.ts) rather than in the query.
  const overdue = (candidates ?? []).filter((task) => {
    const time = (task.due_time ?? "20:00").slice(0, 5);
    const dueAt = new Date(`${task.due_date}T${time}`);
    return dueAt < new Date();
  });

  if (overdue.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const byAssignee = new Map<string, Task[]>();
  for (const task of overdue) {
    const existing = byAssignee.get(task.assigned_to);
    if (existing) {
      existing.push(task);
    } else {
      byAssignee.set(task.assigned_to, [task]);
    }
  }

  const resend = createResendClient();
  let sentCount = 0;

  for (const [userId, tasks] of byAssignee) {
    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (!email) continue;

    const listHtml = tasks
      .map((t) => {
        const time = t.due_time ? ` at ${t.due_time.slice(0, 5)}` : "";
        return `<li>${t.title} (due ${t.due_date}${time})</li>`;
      })
      .join("");

    const { error: sendError } = await resend.emails.send({
      from: REMINDER_FROM_ADDRESS,
      to: email,
      subject:
        tasks.length === 1
          ? `Overdue: ${tasks[0].title}`
          : `You have ${tasks.length} overdue House Tasks`,
      html: `<p>These House Tasks are overdue:</p><ul>${listHtml}</ul>`,
    });

    if (!sendError) {
      sentCount += tasks.length;
      await admin
        .from("tasks")
        .update({ reminder_sent_at: new Date().toISOString() })
        .in(
          "id",
          tasks.map((t) => t.id),
        );
    }
  }

  return NextResponse.json({ sent: sentCount });
}
