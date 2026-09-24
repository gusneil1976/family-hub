"use client";

import { useSave } from "@/lib/client/save";
import { KIOSK_TOGGLE } from "../kiosk-styles";
import { setWatched, setWatching } from "./actions";
import { patchWatchItem, WATCH_KEYS } from "./data";

// Ticks flip on screen straight away (a patch of the cached list, mirroring
// what setWatching/setWatched write); the save runs in the background and is
// undone with a toast if the server refuses it.
export function WatchToggles({
  itemId,
  isWatching,
  watched,
  isKiosk,
}: {
  itemId: string;
  isWatching: boolean;
  watched: boolean;
  isKiosk?: boolean;
}) {
  const save = useSave();
  const textClass = isKiosk ? "text-lg" : "text-sm";
  const boxClass = isKiosk ? KIOSK_TOGGLE : "h-4 w-4";

  function toggleWatching(next: boolean) {
    void save(() => setWatching(itemId, next), {
      keys: [...WATCH_KEYS],
      optimistic: (qc) =>
        patchWatchItem(qc, itemId, (i) => ({ ...i, is_watching: next })),
    });
  }

  function toggleWatched(next: boolean) {
    void save(() => setWatched(itemId, next), {
      keys: [...WATCH_KEYS],
      optimistic: (qc) =>
        patchWatchItem(qc, itemId, (i) => ({
          ...i,
          watched: next,
          watched_at: next ? new Date().toISOString() : null,
          // Marking something watched implicitly means we're done "watching" it.
          is_watching: next ? false : i.is_watching,
        })),
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-4">
      {!watched && (
        <label className={`flex items-center gap-1.5 text-neutral-700 ${textClass}`}>
          <input
            type="checkbox"
            checked={isWatching}
            onChange={(e) => toggleWatching(e.target.checked)}
            className={boxClass}
          />
          Watching
        </label>
      )}
      <label className={`flex items-center gap-1.5 text-neutral-700 ${textClass}`}>
        <input
          type="checkbox"
          checked={watched}
          onChange={(e) => toggleWatched(e.target.checked)}
          className={boxClass}
        />
        Watched
      </label>
    </div>
  );
}
