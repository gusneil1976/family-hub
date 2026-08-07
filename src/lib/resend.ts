import "server-only";

import { Resend } from "resend";

export function createResendClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}

// Resend's shared test domain — works immediately with no DNS setup, but
// for better deliverability to real inboxes, verify a custom domain in
// Resend later and swap this for e.g. "reminders@yourdomain.com".
export const REMINDER_FROM_ADDRESS = "Family Hub <onboarding@resend.dev>";
