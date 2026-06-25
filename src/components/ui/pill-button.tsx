import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/** Pill variants. `primary` = green brand, `accent` = amber CTA (NAVY ink — the
 *  one hero action per view), `ghost` = bordered neutral. */
export type PillVariant = "primary" | "accent" | "ghost";

const VARIANT: Record<PillVariant, string> = {
  primary: "bg-primary text-on-primary",
  accent: "bg-accent-3 text-accent-3-ink",
  ghost: "border border-border bg-surface text-ink hover:bg-surface-2",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

/** A rounded-pill button. */
export function PillButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: { variant?: PillVariant; children: ReactNode } & ComponentProps<"button">) {
  return (
    <button className={`${BASE} ${VARIANT[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** The link-shaped pill (locale-aware Link), same look as PillButton. */
export function PillLink({
  variant = "primary",
  className = "",
  href,
  children,
}: {
  variant?: PillVariant;
  className?: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANT[variant]} ${className}`}>
      {children}
    </Link>
  );
}
