"use client";

// The one popup pattern for kiosk: a centered, full-viewport-safe overlay.
// Replaces window.confirm() (renders unreliably on the fridge's browser —
// the confirm control can end up hidden or unreachable) and any ad-hoc
// inline-expanding rows, so every kiosk interaction that needs a "are you
// sure" or a follow-up choice looks and behaves the same way.
export function KioskModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="mb-4 text-xl font-bold text-neutral-900">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
