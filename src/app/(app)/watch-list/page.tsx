import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { WatchListItem } from "@/lib/types";
import { Badge, PageHeader } from "@/components/ui";
import { KIOSK_BUTTON_PRIMARY, KIOSK_LINK, KIOSK_ROW } from "../kiosk-styles";
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
  canManage,
  isKiosk,
}: {
  items: ItemRow[];
  showCategoryBadge?: boolean;
  canManage: (item: ItemRow) => boolean;
  isKiosk: boolean;
}) {
  if (!items.length) {
    return (
      <p className={isKiosk ? "text-base text-neutral-500" : "text-sm text-neutral-500"}>
        Nothing here yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className={`flex flex-wrap items-center justify-between ${
            isKiosk ? KIOSK_ROW : "gap-3 px-4 py-3 text-sm"
          }`}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`font-medium text-neutral-900 ${isKiosk ? "text-lg" : ""}`}
              >
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
          <div className="flex shrink-0 items-center gap-3">
            {canManage(item) && (
              <Link
                href={`/watch-list/${item.id}/edit`}
                className={
                  isKiosk
                    ? `text-neutral-500 hover:text-neutral-900 ${KIOSK_LINK}`
                    : "text-sm text-neutral-500 underline hover:text-neutral-900"
                }
              >
                Edit
              </Link>
            )}
            <WatchToggles
              itemId={item.id}
              isWatching={item.is_watching}
              watched={item.watched}
              isKiosk={isKiosk}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function WatchListPage() {
  const { supabase, user, profile } = await requireUser();
  const isKiosk = !!profile?.is_kiosk;

  const { data: items } = await supabase
    .from("watch_list_items")
    .select(
      "*, submitter:profiles!watch_list_items_submitted_by_fkey(display_name)",
    )
    .order("created_at", { ascending: false })
    .returns<ItemRow[]>();

  const all = items ?? [];
  const canManage = (item: ItemRow) =>
    item.submitted_by === user.id || !!profile?.is_admin || !!profile?.is_kiosk;
  // Watching items float to the top of their section; stable sort keeps
  // the existing created_at-desc order within each group.
  const active = all
    .filter((i) => !i.watched)
    .sort((a, b) => Number(b.is_watching) - Number(a.is_watching));
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
            className={
              isKiosk
                ? `bg-accent text-accent-foreground hover:bg-accent-hover ${KIOSK_BUTTON_PRIMARY}`
                : "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
            }
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
            <ItemList
              items={active.filter((i) => i.category === "film")}
              canManage={canManage}
              isKiosk={isKiosk}
            />
          </section>

          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">
              TV Shows
            </h2>
            <ItemList
              items={active.filter((i) => i.category === "tv_show")}
              canManage={canManage}
              isKiosk={isKiosk}
            />
          </section>

          {archive.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-neutral-700">
                Watched
              </h2>
              <ItemList
                items={archive}
                showCategoryBadge
                canManage={canManage}
                isKiosk={isKiosk}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
