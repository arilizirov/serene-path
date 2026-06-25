import { z } from "zod";

// Validation contract for admin appointment management (Phase 2). The admin
// pages parse untrusted input (the status filter, the per-action target) through
// these at the boundary (§11). Mirrors Prisma's AppointmentStatus enum.
export const appointmentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);
export type AppointmentStatusValue = z.infer<typeof appointmentStatusSchema>;
