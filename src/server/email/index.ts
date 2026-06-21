// Transactional email adapter (APP_SPEC §10). The rest of the app calls
// sendBookingConfirmation / sendEmail through this seam and never touches a
// provider SDK. No provider is wired yet (it's a gated vendor decision like
// payments/video) — the dev implementation logs the message so the flow is
// exercisable end-to-end; swap the body of sendEmail for Resend/SES/etc. later
// without touching any caller.

export type EmailMessage = { to: string; subject: string; body: string };

export type BookingConfirmationInput = {
  to: string;
  therapistName: string;
  /** A human-readable, already-localized time string (e.g. "Mon 6 Jul 14:00"). */
  whenLabel: string;
  locale: string;
};

type Locale = "en" | "he" | "fr";

// Minimal inline copy kept self-contained (no next-intl coupling in a server
// adapter). Trilingual per APP_SPEC §6; RTL is the client's concern, not the text.
const COPY: Record<
  Locale,
  { subject: string; body: (name: string, when: string) => string }
> = {
  en: {
    subject: "Your session is booked",
    body: (name, when) =>
      `Your session with ${name} is booked for ${when}. It's pending the therapist's confirmation — we'll let you know once it's confirmed.`,
  },
  he: {
    subject: "הפגישה שלך נקבעה",
    body: (name, when) =>
      `הפגישה שלך עם ${name} נקבעה ל-${when}. הבקשה ממתינה לאישור המטפל/ת — נעדכן אותך כשתאושר.`,
  },
  fr: {
    subject: "Votre séance est réservée",
    body: (name, when) =>
      `Votre séance avec ${name} est réservée pour ${when}. Elle est en attente de confirmation du thérapeute — nous vous préviendrons une fois confirmée.`,
  },
};

function asLocale(locale: string): Locale {
  return locale === "he" || locale === "fr" ? locale : "en";
}

/** Build the (localized) confirmation message. Pure — the unit-tested core. */
export function renderBookingConfirmation(
  input: BookingConfirmationInput,
): EmailMessage {
  const copy = COPY[asLocale(input.locale)];
  return {
    to: input.to,
    subject: copy.subject,
    body: copy.body(input.therapistName, input.whenLabel),
  };
}

/**
 * Deliver an email. The single provider seam — a real provider (Resend/SES/…) is
 * dropped in here later behind this signature. No provider is wired yet: in dev
 * we log the message so the flow is exercisable, but NOT in production — the body
 * carries PII (recipient address + name) and APP_SPEC §11 requires minimizing
 * where sensitive data lands (server logs included). So in prod-with-no-provider
 * this is a deliberate no-op (the client still gets on-page + /appointments
 * confirmation) until a provider is configured here.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[email] → ${message.to} :: ${message.subject}\n${message.body}`);
  }
}

/** Render + send a booking confirmation. */
export async function sendBookingConfirmation(
  input: BookingConfirmationInput,
): Promise<void> {
  await sendEmail(renderBookingConfirmation(input));
}
