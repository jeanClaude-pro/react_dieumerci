export type SaleCurrency = "USD" | "FC";

export interface PriceSnapshot {
  enteredPrice: number;
  enteredCurrency: SaleCurrency;
  priceUSD: number;
  priceFC?: number;
  exchangeRate?: number;
}

export interface AmountSnapshot {
  enteredAmount: number;
  enteredCurrency: SaleCurrency;
  amountUSD: number;
  amountFC?: number;
  exchangeRate?: number;
}

export interface StoredSaleItemPrice {
  price?: number;
  unitPrice?: number;
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

export function createAmountSnapshot(
  enteredAmount: number,
  enteredCurrency: SaleCurrency,
  exchangeRate?: number
): AmountSnapshot {
  const price = createPriceSnapshot(enteredAmount, enteredCurrency, exchangeRate);
  return {
    enteredAmount: price.enteredPrice,
    enteredCurrency: price.enteredCurrency,
    amountUSD: price.priceUSD,
    amountFC: price.priceFC,
    exchangeRate: price.exchangeRate,
  };
}

export function getItemUsdUnitPrice(item: StoredSaleItemPrice): number {
  return item.priceUSD ?? item.price ?? item.unitPrice ?? 0;
}

export function getItemUsdTotal(item: StoredSaleItemPrice): number {
  return getItemUsdUnitPrice(item) * item.quantity;
}

export function getItemOriginalUnitPrice(item: StoredSaleItemPrice): number {
  return item.enteredPrice ?? item.price ?? item.unitPrice ?? 0;
}

export function getItemOriginalTotal(item: StoredSaleItemPrice): number {
  return getItemOriginalUnitPrice(item) * item.quantity;
}

export function getItemOriginalCurrency(
  item: StoredSaleItemPrice
): SaleCurrency {
  return item.enteredCurrency ?? "USD";
}

export function getItemFcUnitPrice(item: StoredSaleItemPrice, saleRate?: number): number | undefined {
  if (item.enteredCurrency === "FC" && item.enteredPrice !== undefined) return item.enteredPrice;
  if (item.priceFC !== undefined) return item.priceFC;
  const rate = item.exchangeRate ?? saleRate;
  return rate ? Math.round(getItemUsdUnitPrice(item) * rate) : undefined;
}

export function getItemFcTotal(item: StoredSaleItemPrice, saleRate?: number): number | undefined {
  const unit = getItemFcUnitPrice(item, saleRate);
  return unit === undefined ? undefined : unit * item.quantity;
}

export function getSaleFcTotal(totalUSD: number, items: StoredSaleItemPrice[], saleRate?: number): number | undefined {
  const itemTotals = items.map((item) => getItemFcTotal(item, saleRate));
  if (itemTotals.length && itemTotals.every((value) => value !== undefined)) {
    return itemTotals.reduce((sum, value) => sum + (value ?? 0), 0);
  }
  return saleRate ? Math.round(totalUSD * saleRate) : undefined;
}

export function canAddCartQuantity(
  backendStock: number,
  quantityAlreadyInCart: number,
  quantityToAdd: number
): boolean {
  return backendStock - quantityAlreadyInCart >= quantityToAdd;
}
