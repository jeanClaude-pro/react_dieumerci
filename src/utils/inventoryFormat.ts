import { apiRequest } from "../lib/api";
import type { StockMovementType } from "../types/inventory";

const quantityFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 });
const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lubumbashi",
});
const timeFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lubumbashi" });

export function formatQuantity(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : quantityFormat.format(value);
}

export function formatSigned(value: number): string {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : "−"}${quantityFormat.format(Math.abs(value))}`;
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTimeFormat.format(new Date(value)) : "—";
}

export function formatTime(value: string | Date): string {
  return timeFormat.format(new Date(value));
}

export const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  baseline: "Solde de reprise",
  initial: "Stock initial",
  restock: "Entrée (réapprovisionnement)",
  sale: "Sortie (vente)",
  sale_edit: "Modification de vente",
  sale_void: "Retour (vente annulée)",
  sale_delete: "Retour (vente supprimée)",
  adjustment: "Correction",
  product_delete: "Suppression de l'article",
};

/** GET/POST JSON; throws the server's own message (error or message field). */
export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiRequest(path, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data as { error?: string; message?: string }).error || (data as { message?: string }).message;
    throw new Error(message || `Requête refusée (${response.status})`);
  }
  return data as T;
}
