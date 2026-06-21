import type { ReactNode } from "react";
import { requireRole, logoutAction } from "@/features/accounts";

// Server-side ADMIN guard for every /[locale]/admin/* route (defense in depth
// alongside the middleware gate). requireRole redirects to login if not an admin.
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole("ADMIN", locale);

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between border-b border-outline-variant px-8 py-3">
        <span className="text-sm font-medium text-on-surface-variant">
          Admin
        </span>
        <form action={logoutAction}>
          <input type="hidden" name="locale" defaultValue={locale} />
          <button type="submit" className="text-sm text-primary">
            Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
