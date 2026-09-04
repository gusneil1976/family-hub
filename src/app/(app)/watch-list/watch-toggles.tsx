"use client";

import { useTransition } from "react";
import { KIOSK_TOGGLE } from "../kiosk-styles";
import { setWatched, setWatching } from "./actions";

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
  const [pending, startTransition] = useTransition();
  const textClass = isKiosk ? "text-lg" : "text-sm";
  const boxClass = isKiosk ? KIOSK_TOGGLE : "h-4 w-4";

  return (
    <div className="flex shrink-0 items-center gap-4">
      {!watched && (
        <label className={`flex items-center gap-1.5 text-neutral-700 ${textClass}`}>
          <input
            type="checkbox"
            checked={isWatching}
            disabled={pending}
            onChange={(e) =>
              startTransition(() => setWatching(itemId, e.target.checked))
            }
            className={boxClass}
          />
          Watching
        </label>
      )}
      <label className={`flex items-center gap-1.5 text-neutral-700 ${textClass}`}>
        <input
          type="checkbox"
          checked={watched}
          disabled={pending}
          onChange={(e) =>
            startTransition(() => setWatched(itemId, e.target.checked))
          }
          className={boxClass}
        />
        Watched
      </label>
    </div>
  );
}
