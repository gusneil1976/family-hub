import { notFound } from "next/navigation";
import { requireMiniBreaksAccess } from "@/lib/auth";
import type { MiniBreak } from "@/lib/types";
import { MiniBreakForm } from "../../mini-break-form";
import { updateMiniBreak } from "./actions";
import { DeleteMiniBreakButton } from "./delete-mini-break-button";

export default async function EditMiniBreakPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireMiniBreaksAccess();

  const { data: miniBreak } = await supabase
    .from("mini_breaks")
    .select("*")
    .eq("id", id)
    .single<MiniBreak>();

  if (!miniBreak) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        Edit {miniBreak.title}
      </h1>
      <MiniBreakForm
        action={updateMiniBreak.bind(null, miniBreak.id)}
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
