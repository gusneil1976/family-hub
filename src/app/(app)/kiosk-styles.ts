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
