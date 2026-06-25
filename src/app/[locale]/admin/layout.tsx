import type { ReactNode } from "react";
import { requireRole } from "@/features/accounts";

// Server-side ADMIN guard for every /[locale]/admin/* route (defense in depth
// alongside the middleware gate). requireRole redirects to login if not an admin.
// Each admin page now brings its own DashboardShell (sidebar + topbar + sign
// out), so the layout is just the gate plus a passthrough — no extra chrome.
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole("ADMIN", locale);

  return <>{children}</>;
}
