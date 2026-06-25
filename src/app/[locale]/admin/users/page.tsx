import { listAllUsers } from "@/features/accounts";
import { AdminNav } from "../admin-nav";
import { ChangeRoleForm } from "./change-role-form";
import { ResetPasswordForm } from "./reset-password-form";
import { CreateAdminForm } from "./create-admin-form";

// Always reflect current DB state; also avoids coupling `next build` to a live DB.
export const dynamic = "force-dynamic";

/** "YYYY-MM-DD" in UTC for a stored instant. */
function formatDate(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

// Admin users area (Phase 3). The /admin layout already enforces
// requireRole("ADMIN") for the PAGE, but every mutation here posts to a Server
// Action that re-checks requireRole("ADMIN") on its own (actions.ts) — the page
// guard does not protect the actions. listAllUsers never selects passwordHash.
export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const users = await listAllUsers();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <AdminNav />
      <h1 className="font-heading text-2xl font-bold text-on-background">Users</h1>

      <section className="flex flex-col gap-4">
        <table className="w-full border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-outline-variant text-on-surface-variant">
              <th className="py-2 text-start">Email</th>
              <th className="py-2 text-start">Name</th>
              <th className="py-2 text-start">Created (UTC)</th>
              <th className="py-2 text-start">Role</th>
              <th className="py-2 text-start">Reset password</th>
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
    </main>
  );
}
