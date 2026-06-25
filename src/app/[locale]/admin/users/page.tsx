import { getTranslations } from "next-intl/server";
import { listAllUsers } from "@/features/accounts";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/components/dashboard-nav";
import { ChangeRoleForm } from "./change-role-form";
import { ResetPasswordForm } from "./reset-password-form";
import { CreateAdminForm } from "./create-admin-form";
import { DeleteUserButton } from "./delete-user-button";

// Always reflect current DB state; also avoids coupling `next build` to a live DB.
export const dynamic = "force-dynamic";

/** "YYYY-MM-DD" in UTC for a stored instant. */
function formatDate(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

/** First value of a (possibly array) search param. */
function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Admin users area (Phase 3 + Phase 5 GDPR erasure). The /admin layout already
// enforces requireRole("ADMIN") for the PAGE, but every mutation here posts to a
// Server Action that re-checks requireRole("ADMIN") on its own (actions.ts) — the
// page guard does not protect the actions. listAllUsers never selects
// passwordHash. The last-admin lockout (deleteUser) surfaces as `?error=` here.
export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");
  const error = one((await searchParams).error);
  const users = await listAllUsers();

  return (
    <DashboardShell
      nav={adminNav}
      activeKey="users"
      title={t("title.users")}
      user={{ name: t("principal") }}
      locale={locale}
    >
      <div className="flex flex-col gap-8">
      {error && (
        <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-4">
        <table className="w-full border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-outline-variant text-on-surface-variant">
              <th className="py-2 text-start">Email</th>
              <th className="py-2 text-start">Name</th>
              <th className="py-2 text-start">Created (UTC)</th>
              <th className="py-2 text-start">Role</th>
              <th className="py-2 text-start">Reset password</th>
              <th className="py-2 text-start">Delete</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-outline-variant/40 align-top text-on-surface"
              >
                <td className="py-2">{u.email}</td>
                <td className="py-2">{u.name || "—"}</td>
                <td className="py-2">{formatDate(u.createdAt)}</td>
                <td className="py-2">
                  <ChangeRoleForm
                    userId={u.id}
                    currentRole={u.role}
                    locale={locale}
                  />
                </td>
                <td className="py-2">
                  <ResetPasswordForm userId={u.id} locale={locale} />
                </td>
                <td className="py-2">
                  <DeleteUserButton
                    userId={u.id}
                    email={u.email}
                    locale={locale}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex max-w-md flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6">
        <h2 className="font-heading text-lg font-bold text-on-background">
          Create admin
        </h2>
        <CreateAdminForm locale={locale} />
      </section>
      </div>
    </DashboardShell>
  );
}
