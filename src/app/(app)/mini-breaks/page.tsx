import Link from "next/link";
import { requireMiniBreaksAccess } from "@/lib/auth";
import type { MiniBreak } from "@/lib/types";
import { PageHeader } from "@/components/ui";

export default async function MiniBreaksPage() {
  const { supabase } = await requireMiniBreaksAccess();

  const { data: miniBreaks } = await supabase
    .from("mini_breaks")
    .select("*")
    .order("date_from", { ascending: true, nullsFirst: false })
    .returns<MiniBreak[]>();

  const all = miniBreaks ?? [];

  return (
    <div>
      <PageHeader
        title="Mini Breaks"
        description="Trip ideas for Gus and Anna."
        action={
          <Link
            href="/mini-breaks/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            New mini break
          </Link>
        }
      />

      {all.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No mini break ideas yet — add the first one.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {all.map((mb) => (
            <li key={mb.id}>
              <Link
                href={`/mini-breaks/${mb.id}`}
                className="block px-4 py-3 text-sm hover:bg-neutral-50"
              >
                <span className="font-medium text-neutral-900">
                  {mb.title}
                </span>
                {(mb.date_from || mb.date_to) && (
                  <span className="ml-2 text-neutral-500">
                    {mb.date_from ?? "?"} – {mb.date_to ?? "?"}
                  </span>
                )}
                {mb.notes && (
                  <p className="mt-0.5 max-w-xl truncate text-xs text-neutral-500">
                    {mb.notes}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
