/** Shapes returned by /api/dashboard/* and /api/products/:id/stock-card. */

export interface StockFlows {
  baseline: number;
  entries: number;
  newProducts: number;
  piecesOut: number;
  returns: number;
  adjustmentsIn: number;
  adjustmentsOut: number;
  net: number;
}

export interface LedgerCoverage {
  trackingStartedAt: string | null;
  untrackedProducts?: number;
  baselineAt?: string | null;
  openingKnown: boolean;
  closingKnown: boolean;
  flowsComplete: boolean;
  flowsAvailable: boolean;
}

export interface StockSeriesPoint {
  key: string;
  net: number;
  level: number | null;
}

export type StockMovementType =
  | "baseline" | "initial" | "restock" | "sale" | "sale_edit"
  | "sale_void" | "sale_delete" | "adjustment" | "product_delete";

export interface StockAlertRow {
  _id: string;
  name: string;
  category?: string;
  brand?: string;
  unit?: string;
  stock?: number;
  minStock?: number;
  gap?: number;
  status?: "active" | "inactive";
  lastStockUpdatedAt?: string | null;
  reachedZeroAt?: string;
  deleted?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DashboardSummary {
  generatedAt: string;
  period: { start: string; end: string; granularity: "day" | "month"; endIsNow: boolean };
  coverage: LedgerCoverage;
  stock: {
    unit: "piece";
    opening: number | null;
    closing: number | null;
    current: number;
    flows: StockFlows | null;
  };
  health: {
    products: number;
    pieceProducts: number;
    active: number;
    inactive: number;
    sellable: number;
    outOfStock: number;
    lowStock: number;
    becameOutOfStock: number;
  };
  activity: Partial<Record<StockMovementType, number>>;
  soldProductMovements: {
    productId: string;
    name: string;
    category: string;
    unit: string;
    unitKey: string;
    currentStock: number | null;
    /** Current minimum stock of the product (null when unknown). */
    minStock?: number | null;
    /** Stock of this product at the start of the period (null: before tracking). */
    openingStock?: number | null;
    /** Stock of this product at the end of the period. */
    closingStock?: number | null;
    flows: StockFlows;
  }[];
  transactions: { sales: number };
  series: StockSeriesPoint[];
  categories: { category: string; pieces: number; products: number; grouped?: boolean }[];
  units: { unit: string; dimension: string; products: number; quantity: number }[];
  attention: StockAlertRow[];
}

export interface StockMovementRow {
  _id: string;
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  occurredAt: string;
  saleNumber?: string | null;
  userName?: string | null;
  reason?: string;
}

export interface StockCardResponse {
  period: { start: string; end: string; granularity: "day" | "month" };
  product: {
    _id: string;
    name: string;
    category: string;
    brand?: string;
    unit: string;
    stock: number;
    minStock: number;
    status: "active" | "inactive";
    deleted?: boolean;
    lastStockUpdatedAt?: string | null;
    stockTrackedSince?: string | null;
  };
  summary: {
    opening: number | null;
    closing: number | null;
    flows: StockFlows | null;
    currentStock: number;
    lastStockUpdatedAt: string | null;
  };
  coverage: LedgerCoverage;
  integrity: { ledgerStock: number | null; consistent: boolean | null };
}
