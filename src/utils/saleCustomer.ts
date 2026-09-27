export const WALK_IN_LABEL = "Client de passage";

export interface SaleCustomerInput {
  isWalkIn: boolean;
  customerName: string;
  customerPhone: string;
}

export interface SaleCustomerPayload {
  name: string;
  phone: string;
  email: string;
}

/**
 * Customer part of the POST /sales payload.
 * Walk-in: optional display name only — never a phone, and the server never
 * creates a Customer record for it. Registered: unchanged (name + phone).
 */
export function buildSaleCustomer(input: SaleCustomerInput): SaleCustomerPayload | undefined {
  if (input.isWalkIn) {
    const name = input.customerName.trim();
    return name ? { name, phone: "", email: "" } : undefined;
  }
  return { name: input.customerName, phone: input.customerPhone, email: "" };
}

/** Name printed on the receipt. */
export function receiptCustomerName(input: SaleCustomerInput): string {
  return input.isWalkIn ? input.customerName.trim() || WALK_IN_LABEL : input.customerName;
}

/** Walk-in needs nothing; a registered customer still needs name and phone. */
export function isSaleCustomerValid(input: SaleCustomerInput): boolean {
  return (
    input.isWalkIn ||
    (input.customerName.trim() !== "" && input.customerPhone.trim() !== "")
  );
}
