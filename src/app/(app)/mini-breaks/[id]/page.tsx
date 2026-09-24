"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, PageHeader } from "@/components/ui";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../../loading";
import { useMiniBreak, useMiniBreakCategories } from "../data";
import { AddFileForm } from "./add-file-form";
import { AddUrlForm } from "./add-url-form";
import { DeleteFileButton } from "./delete-file-button";
import { DeleteUrlButton } from "./delete-url-button";

export default function MiniBreakDetailPage() {
  const { id } = useParams<{ id: string }>();
  const me = useRequireAccess((p) => p.has_mini_breaks_access);
  const page = useMiniBreak(id, !!me);
  const categories = useMiniBreakCategories(!!me);

  if (!me || !page.data || !categories.data) return <Loading />;

  const { miniBreak, urls, files } = page.data;

  if (!miniBreak) {
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
      <p className="mb-4 text-sm">
        <Link href="/mini-breaks" className="text-neutral-500 hover:text-neutral-900">
          ← All mini breaks
        </Link>
      </p>

      <PageHeader
        title={miniBreak.title}
        description={
          miniBreak.date_from || miniBreak.date_to
            ? `${miniBreak.date_from ?? "?"} – ${miniBreak.date_to ?? "?"}`
            : undefined
        }
        action={
          <Link
            href={`/mini-breaks/${miniBreak.id}/edit`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Edit
          </Link>
        }
      />

      {miniBreak.notes && (
        <p className="mb-6 whitespace-pre-wrap text-sm text-neutral-800">
          {miniBreak.notes}
        </p>
      )}

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Links</h2>
        {urls.length > 0 && (
          <ul className="mb-3 divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
            {urls.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {u.category?.name && <Badge variant="accent">{u.category.name}</Badge>}
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-neutral-700 underline hover:text-neutral-900"
                  >
                    {u.url}
                  </a>
                </div>
                <DeleteUrlButton miniBreakId={miniBreak.id} urlId={u.id} />
              </li>
            ))}
          </ul>
        )}
        <AddUrlForm miniBreakId={miniBreak.id} categories={categories.data} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Files</h2>
        {files.length > 0 && (
          <ul className="mb-3 space-y-2">
            {files.map((f) => {
              const signedUrl = f.signedUrl;
              return (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-card-border bg-card p-3 shadow-sm"
                >
                  {signedUrl ? (
                    <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset */}
                      <img
                        src={signedUrl}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-md object-cover"
                      />
                    </a>
                  ) : (
                    <span className="h-16 w-16 shrink-0 rounded-md bg-neutral-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-900">
                      {f.description || "No description"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {f.uploader?.display_name && (
                        <span>Uploaded by {f.uploader.display_name}</span>
                      )}
                    </p>
                  </div>
                  <DeleteFileButton miniBreakId={miniBreak.id} fileId={f.id} />
                </li>
              );
            })}
          </ul>
        )}
        <AddFileForm miniBreakId={miniBreak.id} />
      </section>
    </div>
  );
}
