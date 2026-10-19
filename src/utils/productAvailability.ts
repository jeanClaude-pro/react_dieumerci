/**
 * Display mirror of jean-server/utils/productAvailability.js. The server
 * filters (GET /products?availability=sellable) and sale validation are
 * authoritative; these only keep every screen wording the same rule.
 */
import { tr } from "../i18n/translate.ts";

export interface StockFields {
  stock: number;
  minStock?: number;
  status?: "active" | "inactive" | string;
}

export type StockHealth = "out" | "low" | "ok";

/** Sellable = manually active AND at least one piece. Status never flips automatically. */
export function isProductSellable(product: StockFields | null | undefined): boolean {
  return product?.status === "active" && Number(product?.stock) > 0;
}

/** 0 pieces = out; 1..minStock = low (inclusive); no minimum = never low. */
export function stockHealth(product: StockFields): StockHealth {
  const stock = Number(product.stock) || 0;
  const minStock = Number(product.minStock) || 0;
  if (stock <= 0) return "out";
  if (minStock > 0 && stock <= minStock) return "low";
  return "ok";
}

/** Status shown on product lists: manual status first, then stock availability. */
export function productAvailabilityLabel(product: StockFields): { label: string; tone: "success" | "warning" | "danger" | "neutral" } {
  if (product.status !== "active") return { label: tr("availability.inactive", "Inactif"), tone: "neutral" };
  const health = stockHealth(product);
  if (health === "out") return { label: tr("availability.out", "En rupture"), tone: "danger" };
  if (health === "low") return { label: tr("availability.low", "Stock faible"), tone: "warning" };
  return { label: tr("availability.available", "Disponible"), tone: "success" };
}
