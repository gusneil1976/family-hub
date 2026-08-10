"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportFromUrlBox() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) return;
    router.push(`/meal-vote/meals/new?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="mb-6 rounded-md border border-dashed border-neutral-300 p-3">
      <label
        htmlFor="import_url"
        className="mb-1 block text-sm font-medium text-neutral-700"
      >
        Add a meal from a recipe URL
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="import_url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleImport();
            }
          }}
          placeholder="https://example.com/some-recipe"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={!url.trim()}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
        >
          Import
        </button>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Works on sites that publish structured recipe data — most recipe
        blogs do, since it&apos;s how they show up in Google. You&apos;ll
        review everything before saving.
      </p>
    </div>
  );
}
