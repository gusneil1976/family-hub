import type { PendingChainStep } from "@/lib/types";
import { addDuration, type DurationUnit } from "./date-utils";

export type TemplateStepLike = {
  label: string;
  offset_value: number;
  offset_unit: DurationUnit;
  relative_to_previous: boolean;
  recurrence_interval_value: number | null;
  recurrence_interval_unit: DurationUnit | null;
  recurrence_count: number | null;
};

export type NewProjectStep = {
  label: string;
  due_date: string;
  due_time: string | null;
  recurrence_interval_value?: number | null;
  recurrence_interval_unit?: DurationUnit | null;
  pending_chain?: PendingChainStep[] | null;
};

type Anchor = { date: string; time: string | null };

function countLabel(label: string, index: number, count: number): string {
  return count > 1 ? `${label} (${index + 1}/${count})` : label;
}

// Walks `steps` in order, resolving each against either the fixed
// (anchorDate, anchorTime) — for absolute steps — or the previous step's
// resolved date — for relative_to_previous steps. Bounded recurrence
// (recurrence_count set) expands fully inline; indefinite recurrence
// (interval set, count null) creates only its first occurrence and
// "blocks" further relative resolution, since its real end date isn't
// known yet. Anything relative that arrives while blocked is deferred onto
// that blocked step's pending_chain untouched, so a later call to
// expandSteps — anchored at the eventually-finished step's real due date,
// over its stored pending_chain — resumes exactly where this left off, to
// arbitrary depth (a deferred chain can itself contain further bounded,
// indefinite, or absolute steps).
export function expandSteps(
  anchorDate: string,
  anchorTime: string | null,
  steps: TemplateStepLike[],
): NewProjectStep[] {
  const result: NewProjectStep[] = [];
  let knownAnchor: Anchor | null = { date: anchorDate, time: anchorTime };
  let blockedIndex: number | null = null;

  for (const s of steps) {
    const base: Anchor | null = s.relative_to_previous
      ? knownAnchor
      : { date: anchorDate, time: anchorTime };

    if (base === null) {
      const blocked = result[blockedIndex!];
      blocked.pending_chain = blocked.pending_chain ?? [];
      blocked.pending_chain.push({
        label: s.label,
        offset_value: s.offset_value,
        offset_unit: s.offset_unit,
        recurrence_interval_value: s.recurrence_interval_value,
        recurrence_interval_unit: s.recurrence_interval_unit,
        recurrence_count: s.recurrence_count,
      });
      continue;
    }

    const { due_date, due_time } = addDuration(
      base.date,
      base.time,
      s.offset_value,
      s.offset_unit,
    );

    if (!s.recurrence_interval_value) {
      result.push({ label: s.label, due_date, due_time });
      knownAnchor = { date: due_date, time: due_time };
    } else if (s.recurrence_count) {
      const unit = s.recurrence_interval_unit ?? "days";
      let last: Anchor = { date: due_date, time: due_time };
      for (let i = 0; i < s.recurrence_count; i++) {
        const occ = addDuration(due_date, due_time, i * s.recurrence_interval_value, unit);
        result.push({
          label: countLabel(s.label, i, s.recurrence_count),
          due_date: occ.due_date,
          due_time: occ.due_time,
        });
        last = { date: occ.due_date, time: occ.due_time };
      }
      knownAnchor = last;
    } else {
      result.push({
        label: s.label,
        due_date,
        due_time,
        recurrence_interval_value: s.recurrence_interval_value,
        recurrence_interval_unit: s.recurrence_interval_unit,
      });
      blockedIndex = result.length - 1;
      knownAnchor = null;
    }
  }

  return result;
}
