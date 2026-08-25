export type SaleCurrency = "USD" | "FC";

export interface PriceSnapshot {
  enteredPrice: number;
  enteredCurrency: SaleCurrency;
  priceUSD: number;
  priceFC?: number;
  exchangeRate?: number;
}

export interface StoredSaleItemPrice {
  price: number;
  quantity: number;
  total: number;
  enteredPrice?: number;
  enteredCurrency?: SaleCurrency;
  priceUSD?: number;
  priceFC?: number;
  exchangeRate?: number;
}

export function createPriceSnapshot(
  enteredPrice: number,
  enteredCurrency: SaleCurrency,
  exchangeRate?: number
): PriceSnapshot {
  if (!Number.isFinite(enteredPrice) || enteredPrice <= 0) {
    throw new Error("The entered price must be greater than zero");
  }

  if (enteredCurrency === "FC") {
    if (!exchangeRate || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      throw new Error("A valid exchange rate is required for an FC price");
    }

    return {
      enteredPrice,
      enteredCurrency,
      priceUSD: enteredPrice / exchangeRate,
      priceFC: enteredPrice,
      exchangeRate,
    };
  }

  const validRate =
    exchangeRate && Number.isFinite(exchangeRate) && exchangeRate > 0
      ? exchangeRate
      : undefined;

  return {
    enteredPrice,
    enteredCurrency,
    priceUSD: enteredPrice,
    priceFC: validRate ? Math.round(enteredPrice * validRate) : undefined,
    exchangeRate: validRate,
  };
}

export function getItemUsdUnitPrice(item: StoredSaleItemPrice): number {
  return item.priceUSD ?? item.price;
}

export function getItemUsdTotal(item: StoredSaleItemPrice): number {
  return getItemUsdUnitPrice(item) * item.quantity;
}

export function getItemOriginalUnitPrice(item: StoredSaleItemPrice): number {
  return item.enteredPrice ?? item.price;
}

export function getItemOriginalTotal(item: StoredSaleItemPrice): number {
  return getItemOriginalUnitPrice(item) * item.quantity;
}

export function getItemOriginalCurrency(
  item: StoredSaleItemPrice
): SaleCurrency {
  return item.enteredCurrency ?? "USD";
}
