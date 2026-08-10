import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMiniBreaksAccess } from "@/lib/auth";
import type { MiniBreakFile, MiniBreakUrl, MiniBreakUrlCategory } from "@/lib/types";
import { Badge, PageHeader } from "@/components/ui";
import { AddFileForm } from "./add-file-form";
import { AddUrlForm } from "./add-url-form";
import { DeleteFileButton } from "./delete-file-button";
import { DeleteUrlButton } from "./delete-url-button";

type MiniBreakDetail = {
  id: string;
  title: string;
  date_from: string | null;
  date_to: string | null;
  notes: string | null;
};

type UrlRow = MiniBreakUrl & { category: { name: string } | null };

type FileRow = MiniBreakFile & {
  uploader: { display_name: string | null } | null;
};

export default async function MiniBreakDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireMiniBreaksAccess();

  const { data: miniBreak } = await supabase
    .from("mini_breaks")
    .select("id, title, date_from, date_to, notes")
    .eq("id", id)
    .single<MiniBreakDetail>();

  if (!miniBreak) {
    notFound();
  }

  const [{ data: urls }, { data: files }, { data: categories }] =
    await Promise.all([
      supabase
        .from("mini_break_urls")
        .select("*, category:mini_break_url_categories(name)")
        .eq("mini_break_id", id)
        .order("created_at")
        .returns<UrlRow[]>(),
      supabase
        .from("mini_break_files")
        .select(
          "*, uploader:profiles!mini_break_files_uploaded_by_fkey(display_name)",
        )
        .eq("mini_break_id", id)
        .order("created_at")
        .returns<FileRow[]>(),
      supabase
        .from("mini_break_url_categories")
        .select("*")
        .order("name")
        .returns<MiniBreakUrlCategory[]>(),
    ]);

  const filePaths = (files ?? []).map((f) => f.file_path);
  const { data: signedUrls } =
    filePaths.length > 0
      ? await supabase.storage
          .from("mini-break-files")
          .createSignedUrls(filePaths, 3600)
      : { data: [] };

  const signedUrlByPath = new Map(
    (signedUrls ?? []).map((s) => [s.path, s.signedUrl]),
  );

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
        {urls && urls.length > 0 && (
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
        <AddUrlForm miniBreakId={miniBreak.id} categories={categories ?? []} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700">Files</h2>
        {files && files.length > 0 && (
          <ul className="mb-3 space-y-2">
            {files.map((f) => {
              const signedUrl = signedUrlByPath.get(f.file_path);
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
