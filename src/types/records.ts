/** Shapes of history / summary payloads returned by the API (display only). */

/** One audited field change: { from, to } as stored by the server. */
export interface FieldChange {
  from?: unknown;
  to?: unknown;
}

export type FieldChanges = Record<string, FieldChange>;

export interface CountAmount {
  count: number;
  amount: number;
}

/** filtersApplied echoed back by the list endpoints. */
export type AppliedFilters = Record<string, string>;

export interface ExpenseSummaryStats {
  totalRecords: number;
  totalAmount: number;
  validated: CountAmount;
  pending: CountAmount;
  rejected?: CountAmount;
}

export interface SalesSummaryStats {
  revenue: number;
  net: number;
  expenses: number;
  totalRecords: number;
  salesCount: number;
  expensesCount: number;
}

export interface ExpenseHistoryEntry {
  action: string;
  formattedDate?: string;
  timestamp: string;
}

export interface CreditorMovement {
  _id: string;
  amountUSD: number;
  borrowedAt: string;
  status?: string;
}

export interface CreditorHistory {
  creditor: { name: string; remainingBalance?: number; totalBorrowed?: number; totalRepaid?: number };
  loans: CreditorMovement[];
  repayments: CreditorMovement[];
  reconciliation: { borrowed: number; repaid: number; storedOutstanding: number; [key: string]: number | boolean };
}
