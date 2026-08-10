"use client";

import { useTransition } from "react";
import { setWatched, setWatching } from "./actions";

export function WatchToggles({
  itemId,
  isWatching,
  watched,
}: {
  itemId: string;
  isWatching: boolean;
  watched: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-4">
      {!watched && (
        <label className="flex items-center gap-1.5 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={isWatching}
            disabled={pending}
            onChange={(e) =>
              startTransition(() => setWatching(itemId, e.target.checked))
            }
            className="h-4 w-4"
          />
          Watching
        </label>
      )}
      <label className="flex items-center gap-1.5 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={watched}
          disabled={pending}
          onChange={(e) =>
            startTransition(() => setWatched(itemId, e.target.checked))
          }
          className="h-4 w-4"
        />
        Watched
      </label>
    </div>
  );
}
