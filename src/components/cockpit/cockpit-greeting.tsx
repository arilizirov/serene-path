import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

// Greeting panel (right rail, top): a warm welcome + a quick-action launcher.
// Per the plan the launcher is links (not a task/notes system), styled like the
// reference's chip row. Decorative leaf accents echo the reference.

export type QuickAction = {
  key: string;
  label: string;
  href: string;
  icon: "slot" | "message" | "profile";
};

export function CockpitGreeting({
  heading,
  subtitle,
  actions,
}: {
  heading: string;
  subtitle: string;
  actions: QuickAction[];
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-surface p-6 text-center shadow-card">
      <Leaf className="absolute -start-2 top-10 -rotate-12 opacity-70" />
      <Leaf className="absolute -end-2 top-16 rotate-[200deg] opacity-70" />
      <h2 className="relative font-heading text-3xl font-bold leading-tight tracking-[-0.01em] text-ink">
        {heading}
      </h2>
      <p className="relative mx-auto mt-2 max-w-xs text-sm text-ink-2">{subtitle}</p>

      <div className="relative mt-5 flex flex-wrap justify-center gap-2">
        {actions.map((a) => (
          <Link
            key={a.key}
            href={a.href}
            className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-medium text-ink-2 transition hover:bg-accent-soft hover:text-accent-soft-ink"
          >
            <ActionGlyph icon={a.icon} />
            {a.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function ActionGlyph({ icon }: { icon: QuickAction["icon"] }) {
  const inner =
    icon === "slot" ? (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M12 13v4M10 15h4" />
      </>
    ) : icon === "message" ? (
      <>
        <path d="M4 5h16v11H7l-3 3z" />
      </>
    ) : (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {inner}
    </svg>
  );
}

function Leaf({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`h-10 w-10 ${className}`} aria-hidden fill="none">
      <path d="M6 34C6 18 20 6 34 6c0 16-14 28-28 28Z" fill="var(--color-accent-2-soft)" />
      <path d="M10 30C16 20 26 12 32 10" stroke="var(--color-accent-2)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
