import { apiRequest } from "../lib/api";
import type { StockMovementType } from "../types/inventory";
import { activeLocale, tr } from "../i18n/translate";
import { serverMessage } from "../i18n/serverMessages";

// Formatters follow the interface language (created per call: switching
// language must re-render with the new locale immediately).
const quantityFormat = () => new Intl.NumberFormat(activeLocale(), { maximumFractionDigits: 3 });

export function formatQuantity(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : quantityFormat().format(value);
}

export function formatSigned(value: number): string {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : "−"}${quantityFormat().format(Math.abs(value))}`;
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? new Intl.DateTimeFormat(activeLocale(), {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lubumbashi",
  }).format(new Date(value)) : "—";
}

export function formatTime(value: string | Date): string {
  return new Intl.DateTimeFormat(activeLocale(), { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lubumbashi" }).format(new Date(value));
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

/** Movement label in the interface language (inventory.movements.<type>). */
export function movementLabel(type: StockMovementType): string {
  return tr(`inventory.movements.${type}`, MOVEMENT_LABELS[type] ?? type);
}

/** GET/POST JSON; throws the server's own message (error or message field). */
export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiRequest(path, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data as { error?: string; message?: string }).error || (data as { message?: string }).message;
    throw new Error(message ? serverMessage(message) : tr("common.requestRefused", "Requête refusée ({{status}})", { status: response.status }));
  }
  return data as T;
}
