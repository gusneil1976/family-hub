"use client";

import { useMe } from "@/lib/client/me";
import { useSyncedAction } from "@/lib/client/save";
import Loading from "../../loading";
import { useFamily } from "../../house-tasks/data";
import { WatchItemForm } from "../watch-item-form";
import { platformOptionsFrom, useWatchItems, WATCH_KEYS } from "../data";
import { createWatchListItem } from "./actions";

export default function NewWatchListItemPage() {
  const { data: me } = useMe();
  const isKiosk = !!me?.profile.is_kiosk;
  const items = useWatchItems();
  // Kiosk has no personal identity, so the form asks who's suggesting it.
  const family = useFamily(isKiosk);
  // createWatchListItem redirects to the list, which then already shows the
  // new suggestion.
  const action = useSyncedAction(createWatchListItem, [...WATCH_KEYS]);

  if (!me || !items.data || (isKiosk && !family.data)) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Suggest something to watch
      </h1>
      <WatchItemForm
        action={action}
        platformOptions={platformOptionsFrom(items.data)}
        submitLabel="Add to list"
        kioskProfiles={isKiosk ? family.data : undefined}
      />
    </div>
  );
}
