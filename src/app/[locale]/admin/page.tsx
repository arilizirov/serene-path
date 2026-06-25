import { Link } from "@/i18n/navigation";
import { countTherapists } from "@/features/therapists";
import { countFinishedSessions } from "@/features/intake";

// Reflect current DB state (counts), not a build-time snapshot.
export const dynamic = "force-dynamic";

// Admin landing. The /admin layout already enforces requireRole("ADMIN"), so this
// page needs no extra guard; it just links into the two admin areas with counts.
export default async function AdminDashboardPage() {
  const [therapists, conversations] = await Promise.all([
    countTherapists(),
    countFinishedSessions(),
  ]);
  const cards = [
    { href: "/admin/therapists", label: "Therapists", count: therapists },
    { href: "/admin/conversations", label: "Conversations", count: conversations },
  ];
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <h1 className="font-heading text-2xl font-bold text-on-background">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex flex-col gap-1 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 hover:border-primary"
          >
            <span className="text-3xl font-bold text-on-surface">{c.count}</span>
            <span className="text-sm font-medium text-primary">{c.label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
