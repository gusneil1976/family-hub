"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMe } from "@/lib/client/me";
import { useSyncedAction } from "@/lib/client/save";
import Loading from "../../../loading";
import { WatchItemForm } from "../../watch-item-form";
import { platformOptionsFrom, useWatchItems, WATCH_KEYS } from "../../data";
import { updateWatchListItem } from "./actions";
import { DeleteItemButton } from "./delete-item-button";

export default function EditWatchListItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: me } = useMe();
  // The record comes from the cached list (same columns plus the submitter),
  // so the form opens instantly when arriving from the list.
  const items = useWatchItems();
  const action = useSyncedAction(updateWatchListItem.bind(null, id), [...WATCH_KEYS]);

  const item = items.data?.find((i) => i.id === id);
  const canManage =
    !!me &&
    !!item &&
    (item.submitted_by === me.user.id || !!me.profile.is_admin || !!me.profile.is_kiosk);

  useEffect(() => {
    if (me && item && !canManage) router.replace("/watch-list");
  }, [me, item, canManage, router]);

  if (!me || !items.data) return <Loading />;

  if (!item) {
    // Might just be newer than the cached copy — wait for the refresh.
    if (items.isFetching) return <Loading />;
    return (
      <p className="text-sm text-neutral-500">
        That suggestion wasn&apos;t found.{" "}
        <Link href="/watch-list" className="underline hover:text-neutral-900">
          Back to the list
        </Link>
      </p>
    );
  }

  if (!canManage) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit suggestion
      </h1>
      <WatchItemForm
        action={action}
        platformOptions={platformOptionsFrom(items.data)}
        defaultValues={{
          title: item.title,
          category: item.category,
          platform: item.platform,
        }}
        submitLabel="Save changes"
      />
      <div className="mt-6 border-t border-neutral-200 pt-4">
        <DeleteItemButton itemId={item.id} isKiosk={!!me.profile.is_kiosk} />
      </div>
    </div>
  );
}
