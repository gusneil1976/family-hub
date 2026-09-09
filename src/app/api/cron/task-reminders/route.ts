import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addInterval, toDateInputValue } from "@/app/(app)/house-tasks/date-utils";
import { createResendClient, REMINDER_FROM_ADDRESS } from "@/lib/resend";
import type { Task } from "@/lib/types";

// This runs on Vercel's servers, whose process timezone isn't guaranteed to
// be UK time — en-CA gives YYYY-MM-DD directly, and the Europe/London zone
// correctly accounts for the GMT/BST switch, unlike toISOString() (UTC).
function londonToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());
}

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

  let sentCount = 0;

  if (overdue.length > 0) {
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
  }

  // Anything still incomplete after its due date needs handling — most
  // tasks just roll forward to today so the board keeps showing them as
  // due. Time-sensitive tasks (e.g. an alternating chore between two kids)
  // do the opposite: missing the day is treated as a miss, not a delay —
  // auto-marked not completed (same points deduction as the manual
  // button) and, if recurring, advanced to its next scheduled date
  // computed from the original due date, so a single missed turn can't
  // permanently desync the alternation. reminder_sent_at is cleared
  // either way, so a task missed again can trigger a fresh reminder above
  // on a later run instead of staying silent forever.
  const today = londonToday();
  const { data: stale } = await admin
    .from("tasks")
    .select("*")
    .eq("is_active", true)
    .is("completed_at", null)
    .not("due_date", "is", null)
    .lt("due_date", today)
    .returns<Task[]>();

  let rolledCount = 0;
  let autoMissedCount = 0;

  if (stale && stale.length > 0) {
    const toRollForward = stale.filter((t) => !t.is_time_sensitive);
    const toAutoMiss = stale.filter((t) => t.is_time_sensitive);

    if (toRollForward.length > 0) {
      await admin
        .from("tasks")
        .update({ due_date: today, reminder_sent_at: null })
        .in(
          "id",
          toRollForward.map((t) => t.id),
        );
      rolledCount = toRollForward.length;
    }

    for (const task of toAutoMiss) {
      await admin.from("task_completions").insert({
        task_id: task.id,
        completed_by: task.assigned_to,
        points: -task.points,
        closed_task: true,
      });

      const isRecurring = !!task.recurrence_unit && !!task.recurrence_value;
      if (isRecurring) {
        const nextDue = toDateInputValue(
          addInterval(
            new Date(task.due_date!),
            task.recurrence_unit!,
            task.recurrence_value!,
          ),
        );
        await admin
          .from("tasks")
          .update({ due_date: nextDue, reminder_sent_at: null })
          .eq("id", task.id);
      } else {
        await admin
          .from("tasks")
          .update({
            completed_at: new Date().toISOString(),
            reminder_sent_at: null,
          })
          .eq("id", task.id);
      }
      autoMissedCount++;
    }
  }

  return NextResponse.json({
    sent: sentCount,
    rolledForward: rolledCount,
    autoMissed: autoMissedCount,
  });
}
