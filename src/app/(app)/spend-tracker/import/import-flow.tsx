"use client";

import { useRef, useState, useTransition } from "react";
import type { SpendCategory } from "@/lib/types";
import { formatGBP } from "../format";
import { commitImport, parseImportCsv, type ImportDraftRow } from "./actions";

type DraftRow = ImportDraftRow & { include: boolean };

export function ImportFlow({
  categories,
  vendorNames,
}: {
  categories: SpendCategory[];
  vendorNames: string[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [skippedDuplicates, setSkippedDuplicates] = useState<number | null>(null);
  const [rows, setRows] = useState<DraftRow[] | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const includedCount = rows?.filter((r) => r.include).length ?? 0;

  const handleParse = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    setError(null);
    setResult(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const res = await parseImportCsv(formData);
      if ("error" in res) {
        setError(res.error);
        setRows(null);
        return;
      }
      setSkippedDuplicates(res.skippedDuplicates);
      setRows(res.rows.map((r) => ({ ...r, include: true })));
    });
  };

  const updateRow = (index: number, patch: Partial<DraftRow>) => {
    setRows((prev) =>
      prev ? prev.map((r, i) => (i === index ? { ...r, ...patch } : r)) : prev,
    );
  };

  const handleImport = () => {
    if (!rows) return;
    const selected = rows.filter((r) => r.include);
    setError(null);
    startTransition(async () => {
      const res = await commitImport(
        selected.map(({ date, rawDescription, vendor, categoryId, amount }) => ({
          date,
          rawDescription,
          vendor,
          categoryId,
          amount,
        })),
      );
      if (res.error) {
        setError(res.error);
        return;
      }
      setResult(`Imported ${res.imported} transaction${res.imported === 1 ? "" : "s"}.`);
      setRows(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="text-sm"
        />
        <button
          type="button"
          disabled={pending}
          onClick={handleParse}
          className="rounded-md bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {pending && !rows ? "Parsing…" : "Parse CSV"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && <p className="mt-3 text-sm text-emerald-700">{result}</p>}

      {rows && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-neutral-500">
            {rows.length} new transaction{rows.length === 1 ? "" : "s"} to review
            {skippedDuplicates ? ` · ${skippedDuplicates} likely duplicate${skippedDuplicates === 1 ? "" : "s"} skipped` : ""}.
          </p>

          {rows.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-xl border border-card-border bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="px-3 py-2 text-left font-semibold text-neutral-700">Include</th>
                      <th className="px-3 py-2 text-left font-semibold text-neutral-700">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-neutral-700">Vendor</th>
                      <th className="px-3 py-2 text-left font-semibold text-neutral-700">Category</th>
                      <th className="px-3 py-2 text-right font-semibold text-neutral-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-neutral-100 last:border-0 align-top">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={row.include}
                            onChange={(e) => updateRow(i, { include: e.target.checked })}
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-neutral-900">{row.date}</td>
                        <td className="px-3 py-2">
                          <input
                            value={row.vendor}
                            onChange={(e) => updateRow(i, { vendor: e.target.value })}
                            list="import-vendor-options"
                            className="w-full min-w-[10rem] rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-accent focus:outline-none"
                          />
                          <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-400" title={row.rawDescription}>
                            {row.rawDescription}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={row.categoryId ?? ""}
                            onChange={(e) =>
                              updateRow(i, { categoryId: e.target.value || null })
                            }
                            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm focus:border-accent focus:outline-none"
                          >
                            <option value="">Uncategorized</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-foreground">
                          {formatGBP(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <datalist id="import-vendor-options">
                {vendorNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>

              <button
                type="button"
                disabled={pending || includedCount === 0}
                onClick={handleImport}
                className="mt-4 rounded-md bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {pending ? "Importing…" : `Import ${includedCount} transaction${includedCount === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
