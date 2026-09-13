// Client-side camera permission gate. This is a UX/defense-in-depth check —
// the actual receipt approve/verify authorization is enforced server-side
// (see jean-server/routes/sales.js requireReceiptRole) regardless of which
// input method (physical scanner or camera) produced the token. This module
// only decides whether the camera UI/API may be used at all, on either
// "Validation paiement" or "Contrôle paiement" — deliberately admin-only.
import type { Role } from "../types/auth";

export function canUseCamera(role: Role | null | undefined): boolean {
  return role === "admin";
}
