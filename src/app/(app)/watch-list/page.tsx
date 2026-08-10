import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { WatchListItem } from "@/lib/types";
import { Badge, PageHeader } from "@/components/ui";
import { WatchToggles } from "./watch-toggles";

type ItemRow = WatchListItem & {
  submitter: { display_name: string | null } | null;
};

const CATEGORY_LABELS: Record<ItemRow["category"], string> = {
  film: "Films",
  tv_show: "TV Shows",
};

function ItemList({
  items,
  showCategoryBadge = false,
}: {
  items: ItemRow[];
  showCategoryBadge?: boolean;
}) {
  if (!items.length) {
    return <p className="text-sm text-neutral-500">Nothing here yet.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-neutral-900">
                {item.title}
              </span>
              {showCategoryBadge && (
                <Badge>{CATEGORY_LABELS[item.category]}</Badge>
              )}
              <Badge variant="accent">{item.platform}</Badge>
              {item.is_watching && <Badge variant="success">Watching</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">
              {item.submitter?.display_name && (
                <span>Suggested by {item.submitter.display_name}</span>
              )}
            </p>
          </div>
          <WatchToggles
            itemId={item.id}
            isWatching={item.is_watching}
            watched={item.watched}
          />
        </li>
      ))}
    </ul>
  );
}

export default async function WatchListPage() {
  const { supabase } = await requireUser();

  const { data: items } = await supabase
    .from("watch_list_items")
    .select(
      "*, submitter:profiles!watch_list_items_submitted_by_fkey(display_name)",
    )
    .order("created_at", { ascending: false })
    .returns<ItemRow[]>();

  const all = items ?? [];
  const active = all.filter((i) => !i.watched);
  const archive = all
    .filter((i) => i.watched)
    .sort((a, b) => (b.watched_at ?? "").localeCompare(a.watched_at ?? ""));

  return (
    <div>
      <PageHeader
        title="TV Shows/Movies"
        description="Submit ideas for family watching time."
        action={
          <Link
            href="/watch-list/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            Suggest something
          </Link>
        }
      />

      {all.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nothing suggested yet — add the first one.
        </p>
      ) : (
        <>
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">
              Films
            </h2>
            <ItemList items={active.filter((i) => i.category === "film")} />
          </section>

          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">
              TV Shows
            </h2>
            <ItemList
              items={active.filter((i) => i.category === "tv_show")}
            />
          </section>

          {archive.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-neutral-700">
                Watched
              </h2>
              <ItemList items={archive} showCategoryBadge />
            </section>
          )}
        </>
      )}
    </div>
  );
}
