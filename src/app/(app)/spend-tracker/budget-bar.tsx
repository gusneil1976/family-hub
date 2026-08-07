import { formatGBP } from "./format";

export function BudgetBar({
  label,
  actual,
  budget,
  emphasize = false,
}: {
  label: string;
  actual: number;
  budget: number | null;
  emphasize?: boolean;
}) {
  const over = budget !== null && actual > budget;
  const pct = budget ? Math.min(100, (actual / budget) * 100) : actual > 0 ? 100 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className={emphasize ? "font-semibold text-foreground" : "text-neutral-900"}>
          {label}
        </span>
        <span className={over ? "font-medium text-red-600" : "text-neutral-500"}>
          {formatGBP(actual)}
          {budget !== null ? ` / ${formatGBP(budget)}` : " · no budget set"}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-2 rounded-full ${
            budget === null ? "bg-neutral-300" : over ? "bg-red-500" : "bg-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
