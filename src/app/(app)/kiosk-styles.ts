// Shared Tailwind class strings for kiosk-sized touch targets, so the
// sizing stays consistent across House Tasks/TV Shows/DIY Tasks/Meal Vote
// instead of being re-typed per component. Only used when profile.is_kiosk
// — normal logins keep their existing (smaller, mouse-oriented) sizing.

export const KIOSK_BUTTON_PRIMARY =
  "rounded-xl px-5 py-3 text-lg font-semibold";
export const KIOSK_BUTTON_SECONDARY =
  "rounded-xl border-2 px-5 py-3 text-lg font-semibold";
export const KIOSK_LINK = "text-lg font-medium underline";
export const KIOSK_ROW = "gap-4 px-5 py-4 text-base";
export const KIOSK_TOGGLE = "h-7 w-7";
// Square icon-only trigger — used where a row repeats per task/item and a
// text label (e.g. "Complete"/"Not completed") would take up more room
// than it's worth; the icon's own tap target is still big.
export const KIOSK_ICON_BUTTON =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl";
