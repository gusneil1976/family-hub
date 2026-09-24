"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireAccess } from "@/lib/client/me";
import { useSyncedAction } from "@/lib/client/save";
import Loading from "../../../loading";
import { MiniBreakForm } from "../../mini-break-form";
import { MINI_BREAKS, miniBreakKey, useMiniBreaks } from "../../data";
import { updateMiniBreak } from "./actions";
import { DeleteMiniBreakButton } from "./delete-mini-break-button";

export default function EditMiniBreakPage() {
  const { id } = useParams<{ id: string }>();
  const me = useRequireAccess((p) => p.has_mini_breaks_access);
  // The record comes from the cached list (same columns), so the form opens
  // instantly. updateMiniBreak redirects to the detail page, which is
  // re-synced first so it already shows the change.
  const miniBreaks = useMiniBreaks(!!me);
  const action = useSyncedAction(updateMiniBreak.bind(null, id), [
    MINI_BREAKS,
    miniBreakKey(id),
  ]);

  if (!me || !miniBreaks.data) return <Loading />;

  const miniBreak = miniBreaks.data.find((mb) => mb.id === id);
  if (!miniBreak) {
    // Might just be newer than the cached copy — wait for the refresh.
    if (miniBreaks.isFetching) return <Loading />;
    return (
      <p className="text-sm text-neutral-500">
        That mini break wasn&apos;t found.{" "}
        <Link href="/mini-breaks" className="underline hover:text-neutral-900">
          All mini breaks
        </Link>
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit {miniBreak.title}
      </h1>
      <MiniBreakForm
        action={action}
        defaultValues={{
          title: miniBreak.title,
          date_from: miniBreak.date_from,
          date_to: miniBreak.date_to,
          notes: miniBreak.notes,
        }}
        submitLabel="Save changes"
      />
      <div className="mt-6 border-t border-neutral-200 pt-4">
        <DeleteMiniBreakButton miniBreakId={miniBreak.id} />
      </div>
    </div>
  );
}
