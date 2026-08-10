import type { Profile } from "@/lib/types";

// Shown only on the kiosk (shared, always-logged-in) account, wherever an
// action would otherwise be attributed to whoever's logged in — voting,
// suggesting something to watch, creating a task. Reads as a required
// select named "performed_by"; the receiving server action only honors it
// when the caller's own profile is actually the kiosk account (see
// supabase/migrations/0027_kiosk_mode.sql).
export function WhoPicker({
  profiles,
  label = "Who's doing this?",
}: {
  profiles: Profile[];
  label?: string;
}) {
  return (
    <div>
      <label
        htmlFor="performed_by"
        className="mb-1 block text-sm font-medium text-neutral-700"
      >
        {label}
      </label>
      <select
        id="performed_by"
        name="performed_by"
        required
        defaultValue=""
        className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-base focus:border-accent focus:outline-none"
      >
        <option value="" disabled>
          Choose a person…
        </option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.display_name}
          </option>
        ))}
      </select>
    </div>
  );
}
