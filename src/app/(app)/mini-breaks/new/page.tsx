"use client";

import { useRequireAccess } from "@/lib/client/me";
import { useSyncedAction } from "@/lib/client/save";
import Loading from "../../loading";
import { MiniBreakForm } from "../mini-break-form";
import { MINI_BREAKS, useMiniBreakCategories } from "../data";
import { createMiniBreak } from "./actions";

export default function NewMiniBreakPage() {
  const me = useRequireAccess((p) => p.has_mini_breaks_access);
  const categories = useMiniBreakCategories(!!me);
  // createMiniBreak redirects to the new mini break's own page (fetched fresh);
  // the list is re-synced so it's there on the way back.
  const action = useSyncedAction(createMiniBreak, [MINI_BREAKS]);

  if (!me || !categories.data) return <Loading />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New mini break idea
      </h1>
      <MiniBreakForm
        action={action}
        submitLabel="Create"
        categories={categories.data}
      />
    </div>
  );
}
