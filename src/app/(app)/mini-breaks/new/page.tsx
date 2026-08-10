import { requireMiniBreaksAccess } from "@/lib/auth";
import { MiniBreakForm } from "../mini-break-form";
import { createMiniBreak } from "./actions";

export default async function NewMiniBreakPage() {
  await requireMiniBreaksAccess();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        New mini break idea
      </h1>
      <MiniBreakForm action={createMiniBreak} submitLabel="Create" />
    </div>
  );
}
