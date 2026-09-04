import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Roll forward any task still incomplete after its due date, so the
  // board always shows it as "due today" instead of letting stale overdue
  // dates pile up — clearing reminder_sent_at too, so a task that gets
  // missed again after rolling forward can trigger a fresh reminder above
  // on a later run instead of staying silent forever.
  const today = londonToday();
  const { data: stale } = await admin
    .from("tasks")
    .select("id")
    .eq("is_active", true)
    .is("completed_at", null)
    .not("due_date", "is", null)
    .lt("due_date", today);

  let rolledCount = 0;
  if (stale && stale.length > 0) {
    await admin
      .from("tasks")
      .update({ due_date: today, reminder_sent_at: null })
      .in(
        "id",
        stale.map((t) => t.id),
      );
    rolledCount = stale.length;
  }

  return NextResponse.json({ sent: sentCount, rolledForward: rolledCount });
}
