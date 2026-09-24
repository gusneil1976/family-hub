"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { useRequireAccess } from "@/lib/client/me";
import Loading from "../loading";
import { useProjects } from "./data";

export default function CuringProjectsPage() {
  const me = useRequireAccess((p) => p.has_baking_access);
  const projects = useProjects();

  if (!me || !projects.data) return <Loading />;

  const all = projects.data;

  return (
    <div>
      <PageHeader
        title="Curing Projects"
        description="Home food projects and their follow-up schedule."
        action={
          <Link
            href="/curing/new"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            New project
          </Link>
        }
      />

      {all.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No projects yet — start one, optionally from a template.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-card-border bg-card shadow-sm">
          {all.map((project) => {
            const total = project.steps.length;
            const done = project.steps.filter((s) => s.completed_at).length;
            return (
              <li key={project.id}>
                <Link
                  href={`/curing/${project.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-neutral-50"
                >
                  <div>
                    <span className="font-medium text-neutral-900">
                      {project.name}
                    </span>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Started {project.start_date}
                      {project.initial_weight != null && (
                        <span>
                          {" "}
                          · {project.initial_weight}g
                          {project.target_weight != null &&
                            ` → ${project.target_weight}g`}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-neutral-500">
                    {done}/{total} step{total === 1 ? "" : "s"} done
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
