"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";

// Shown only on the kiosk (shared, always-logged-in) account, wherever an
// action would otherwise be attributed to whoever's logged in — voting,
// suggesting something to watch, creating a task. A grid of big tap
// targets rather than a <select> — on the fridge's touchscreen a native
// select just pops up an awkward OS picker instead of a proper tap target.
// Carries the choice via a hidden input named "performed_by", same
// contract the receiving server actions already expect (only honored when
// the caller's own profile is actually the kiosk account — see
// supabase/migrations/0027_kiosk_mode.sql).
export function WhoPicker({
  profiles,
  label = "Who's doing this?",
  onChange,
}: {
  profiles: Profile[];
  label?: string;
  // Only needed outside a <form> submission flow — e.g. a modal that calls
  // a server action directly rather than reading FormData. The hidden
  // input below still carries the selection for the normal form case.
  onChange?: (id: string) => void;
}) {
  const [selected, setSelected] = useState("");

  function select(id: string) {
    setSelected(id);
    onChange?.(id);
  }

  return (
    <div>
      {label && (
        <p className="mb-2 text-base font-semibold text-neutral-700">{label}</p>
      )}
      <input type="hidden" name="performed_by" value={selected} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => select(p.id)}
            className={`rounded-xl border-2 px-4 py-5 text-lg font-semibold transition-colors ${
              selected === p.id
                ? "border-accent bg-accent text-accent-foreground"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-accent"
            }`}
          >
            {p.display_name}
          </button>
        ))}
      </div>
    </div>
  );
}
