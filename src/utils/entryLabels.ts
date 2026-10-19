import type { TFunction } from "i18next";

/**
 * Entry sources and categories are stored in the database as these exact
 * French strings. They are never changed; only their on-screen label follows
 * the interface language. Unknown (older or custom) values are shown as stored.
 */
export const ENTRY_SOURCES: Record<string, string> = {
  "Paiement Client": "clientPayment",
  "Dépôt Bancaire": "bankDeposit",
  "Reçu d'Espèces": "cashReceipt",
  "Remboursement Prêt": "loanRepayment",
  "Investissement": "investment",
  "Revenue Divers": "miscIncome",
  "Transfert Mobile": "mobileTransfer",
  "Autre Source": "otherSource",
};

export const ENTRY_CATEGORIES: Record<string, string> = {
  "Revenue Ventes": "salesIncome",
  "Dépôt Espèces": "cashDeposit",
  "Remboursement": "repayment",
  "Prêt": "loan",
  "Investissement": "investment",
  "Revenue Divers": "miscIncome",
  "Autre Catégorie": "otherCategory",
};

export const entrySourceLabel = (t: TFunction, value: string) =>
  ENTRY_SOURCES[value] ? t(`entryValues.sources.${ENTRY_SOURCES[value]}`) : value;

export const entryCategoryLabel = (t: TFunction, value: string) =>
  ENTRY_CATEGORIES[value] ? t(`entryValues.categories.${ENTRY_CATEGORIES[value]}`) : value;

/** UI payment choices of the cash forms (stored as cash / card / transfer / other). */
export const uiPaymentLabel = (t: TFunction, value: string) =>
  t(`entryValues.payments.${value}`, { defaultValue: value });
