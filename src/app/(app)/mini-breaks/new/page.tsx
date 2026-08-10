import { requireMiniBreaksAccess } from "@/lib/auth";
import type { MiniBreakUrlCategory } from "@/lib/types";
import { MiniBreakForm } from "../mini-break-form";
import { createMiniBreak } from "./actions";

export default async function NewMiniBreakPage() {
  const { supabase } = await requireMiniBreaksAccess();

  const { data: categories } = await supabase
    .from("mini_break_url_categories")
    .select("*")
    .order("name")
    .returns<MiniBreakUrlCategory[]>();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New mini break idea
      </h1>
      <MiniBreakForm
        action={createMiniBreak}
        submitLabel="Create"
        categories={categories ?? []}
      />
    </div>
  );
}
