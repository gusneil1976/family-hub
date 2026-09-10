"use client";

import { useState, useTransition } from "react";
import { toggleChecklistItem } from "./actions";

export type ChecklistIngredient = {
  itemId: string;
  ingredientId: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  checked: boolean;
};

export type ChecklistGroup = {
  mealId: string;
  mealName: string;
  items: ChecklistIngredient[];
};

function formatIngredient(item: ChecklistIngredient) {
  return [item.quantity, item.unit, item.name].filter(Boolean).join(" ");
}

export function ShoppingChecklist({
  groups,
  readOnly,
  readOnlyReason,
}: {
  groups: ChecklistGroup[];
  readOnly: boolean;
  readOnlyReason?: string;
}) {
  const allItems = groups.flatMap((g) => g.items);
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(
    Object.fromEntries(allItems.map((i) => [i.itemId, i.checked])),
  );
  const [, startTransition] = useTransition();

  function toggle(itemId: string, next: boolean) {
    if (readOnly) return;
    setCheckedMap((prev) => ({ ...prev, [itemId]: next }));
    startTransition(() => {
      toggleChecklistItem(itemId, next);
    });
  }

  // Kept flat and alphabetical, unlike the tick-off list above it — this
  // one's meant to be walked round the shop with, where what it's for
  // matters less than not missing anything or buying it twice.
  const remaining = allItems
    .filter((i) => !checkedMap[i.itemId])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <section className="mb-6 print:hidden">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">
          Tick off what you already have
        </h2>
        {readOnly && readOnlyReason && (
          <p className="mb-2 text-xs text-neutral-500">{readOnlyReason}</p>
        )}
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.mealId}>
              <h3 className="mb-1 text-xs font-semibold text-neutral-500">
                {group.mealName}
              </h3>
              <ul
                className={`divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm ${
                  readOnly ? "opacity-50" : ""
                }`}
              >
                {group.items.map((item) => (
                  <li
                    key={item.itemId}
                    className="flex min-h-12 items-center gap-3 px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checkedMap[item.itemId] ?? false}
                      disabled={readOnly}
                      onChange={(e) => toggle(item.itemId, e.target.checked)}
                      className="h-5 w-5 shrink-0 disabled:cursor-not-allowed"
                    />
                    <span
                      className={
                        checkedMap[item.itemId]
                          ? "text-neutral-400 line-through"
                          : "text-neutral-900"
                      }
                    >
                      {formatIngredient(item)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700">
            Shopping list
          </h2>
          <button
            type="button"
            onClick={() => window.print()}
            className="text-sm text-neutral-500 underline print:hidden"
          >
            Print
          </button>
        </div>
        {remaining.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nothing needed — you have it all!
          </p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-800">
            {remaining.map((item) => (
              <li key={item.itemId}>{formatIngredient(item)}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
