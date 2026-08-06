export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-card-border bg-card p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

type BadgeVariant = "neutral" | "accent" | "warning" | "success";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  neutral: "bg-neutral-100 text-neutral-600",
  accent: "bg-accent-soft text-accent-soft-foreground",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string | number;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        emphasize
          ? "border-transparent bg-sidebar"
          : "border-card-border bg-card"
      }`}
    >
      <p
        className={`text-2xl font-bold ${emphasize ? "text-white" : "text-foreground"}`}
      >
        {value}
      </p>
      <p
        className={`mt-0.5 text-xs ${emphasize ? "text-sidebar-muted" : "text-neutral-500"}`}
      >
        {label}
      </p>
    </div>
  );
}

export function StatTileRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
