import PageHeader from "../components/ui/PageHeader";
import ExchangeRateChip from "../components/ui/ExchangeRateChip";
import { EmptyState } from "../components/ui/States";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState, useRef } from "react";
import { formatNowGMT2 } from "../utils/dateUtils";
import { useAuth } from "../hooks/useAuth";
import { AlertTriangle, CheckCircle2, IdCard, Loader2, Lock, Minus, Package, PackageX, Plus, Search, ShoppingCart, Trash2, UserRound, XCircle } from "lucide-react";
import { serverUrl } from "../utils/constants";
import QRCode from "qrcode";
import {
  canAddCartQuantity,
  createPriceSnapshot,
  getItemFcTotal,
  getItemFcUnitPrice,
  getSaleFcTotal,
  type PriceSnapshot,
  type SaleCurrency,
} from "../utils/salePricing";
import { buildSaleCustomer, isSaleCustomerValid, receiptCustomerName } from "../utils/saleCustomer";
import { isProductSellable } from "../utils/productAvailability";

const compactFc = (value: number) => `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)}FC`;
const compactDualUnit = (item: CartItem, rate?: number) => {
  const fc = getItemFcUnitPrice(item, rate);
  return `${item.priceUSD.toFixed(2)}$${fc === undefined ? "" : ` / ${compactFc(fc)}`}`;
};
const compactDualTotal = (item: CartItem, rate?: number) => {
  const fc = getItemFcTotal(item, rate);
  return `${(item.priceUSD * item.quantity).toFixed(2)}$${fc === undefined ? "" : ` / ${compactFc(fc)}`}`;
};
const compactDualSaleTotal = (total: number, items: CartItem[], rate?: number) => {
  const fc = getSaleFcTotal(total, items, rate);
  return `${total.toFixed(2)}$${fc === undefined ? "" : ` / ${compactFc(fc)}`}`;
};

interface Product {
  _id: string;
  name: string;
  sku?: string;
  stock: number;
  price?: number;
  status?: "active" | "inactive";
}

interface CartItem extends PriceSnapshot {
  productId: string;
  name: string;
  quantity: number;
  // USD remains the receipt/API compatibility currency.
  unitPrice: number;
  total: number;
}

interface ExchangeRate {
  rate: number;
  effectiveFrom: string;
  lastUpdated: string;
}

const API_BASE = serverUrl;

type UiPayment = "cash" | "mpesa" | "card" | "bank" | "other";
type ModelPayment = "cash" | "card" | "transfer" | "other";

function uiToModelPayment(pm: UiPayment): ModelPayment {
  if (pm === "cash") return "cash";
  if (pm === "card") return "card";
  if (pm === "mpesa" || pm === "bank") return "transfer";
  return "other";
}

async function readJsonSafe(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const text = await res.text();
  return { __nonJson: true, text };
}

// Only products that can be sold right now (active, stock > 0). The server
// filters and still rejects any sale of an unavailable product; the client
// filter only protects against a stale or older server response.
async function fetchSellableProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products?availability=sellable`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  });
  const data = await readJsonSafe(res);
  if (!res.ok) {
    const msg =
      (data as any)?.error ||
      (data as any)?.text ||
      `Products fetch failed: ${res.status}`;
    throw new Error(msg);
  }
  const list: Product[] = Array.isArray((data as any)?.products)
    ? (data as any).products
    : Array.isArray(data) && !(data as any).__nonJson
    ? (data as any)
    : [];
  return list.filter(isProductSellable);
}

// Simplified Print service for ESC/POS printing
class PrintService {
  static async printReceipt(
    receiptData: any,
    type: "sale" = "sale"
  ): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/print/receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ receiptData, type }),
      });

      if (!response.ok) {
        throw new Error("Failed to print receipt");
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Print receipt error:", error);
      throw error;
    }
  }

  static async printStub(
    receiptData: any,
    type: "sale" = "sale"
  ): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/print/stub`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ receiptData, type }),
      });

      if (!response.ok) {
        throw new Error("Failed to print stub");
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Print stub error:", error);
      throw error;
    }
  }
}

export default function NewSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [shopSettings, setShopSettings] = useState({
    shopName: "ETS. DIEU MERCI",
    shopAddress: "Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",
    shopNumber: "+243 977 771 421 / +243 853 549 102",
    shopRegistration: "RCCM: 14-A-017885",
    receiptFooter: "Merci pour votre confiance ! À bientôt.",
  });
  const receiptRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Get the current user from your auth context
  const { user: currentUser } = useAuth();

  // Can this user override product prices?
  const canEditPrice =
    currentUser?.role === "admin" ||
    currentUser?.role === "manager" ||
    (currentUser?.actionPermissions ?? []).includes("edit_receipts");

  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    unitPrice: "",
    priceInFC: "",
    customerName: "",
    customerPhone: "",
    // Ordinary counter sales are walk-in: selected by default.
    isWalkIn: true,
    paymentMethod: "cash" as UiPayment,
    currencyMode: "usd" as "usd" | "fc",
    priceSource: "USD" as SaleCurrency,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Presentation only: keyboard highlight in article search, feedback anchor.
  const [activeResult, setActiveResult] = useState(-1);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Check if user is admin
  const isAdmin = currentUser?.role === "admin";

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load shop settings for receipts
  const loadShopSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/receipt`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShopSettings({
          shopName: data.shopName || "ETS. DIEU MERCI",
          shopAddress: data.shopAddress || "",
          shopNumber: data.shopNumber || "",
          shopRegistration: data.shopRegistration || "",
          receiptFooter: data.receiptFooter || "",
        });
      }
    } catch (err) {
      console.warn("Could not load shop settings, using defaults:", err);
    }
  };

  // Load exchange rate
  const loadExchangeRate = async () => {
    try {
      setLoadingRate(true);
      const response = await fetch(`${API_BASE}/exchange-rates/current`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data);
      } else {
        console.warn('Failed to load exchange rate');
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    async function loadInitialData() {
      setLoadingProducts(true);
      setError(null);
      
      try {
        // Load products, exchange rate and shop settings concurrently
        await Promise.all([
          loadProducts(),
          loadExchangeRate(),
          loadShopSettings(),
        ]);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load initial data");
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }

    async function loadProducts() {
      try {
        const list = await fetchSellableProducts();
        if (!cancelled) setProducts(list);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load products");
      }
    }

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  const product = useMemo(
    () => products.find((p) => p._id === form.productId),
    [products, form.productId]
  );

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  const quantity = parseInt(form.quantity) || 0;
  const enteredPrice =
    parseFloat(form.priceSource === "FC" ? form.priceInFC : form.unitPrice) || 0;
  const currentPrice = useMemo<PriceSnapshot | null>(() => {
    if (enteredPrice <= 0) return null;

    try {
      return createPriceSnapshot(
        enteredPrice,
        form.priceSource,
        exchangeRate?.rate
      );
    } catch {
      return null;
    }
  }, [enteredPrice, exchangeRate?.rate, form.priceSource]);
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const cartOriginalTotals = cart.reduce(
    (totals, item) => {
      totals[item.enteredCurrency] += item.enteredPrice * item.quantity;
      return totals;
    },
    { USD: 0, FC: 0 }
  );

  const isFormValid = cart.length > 0 && isSaleCustomerValid(form);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // Switching customer type keeps the typed name (optional for a walk-in,
  // required for a registered customer); a walk-in never keeps a phone.
  function setCustomerType(isWalkIn: boolean) {
    setForm((f) =>
      f.isWalkIn === isWalkIn
        ? f
        : { ...f, isWalkIn, customerPhone: isWalkIn ? "" : f.customerPhone }
    );
  }

  // Handle product selection from search
  const handleProductSelect = (selectedProduct: Product) => {
    setForm(prev => ({
      ...prev,
      productId: selectedProduct._id,
      unitPrice: selectedProduct.price ? selectedProduct.price.toString() : "",
      priceInFC:
        selectedProduct.price && exchangeRate
          ? Math.round(selectedProduct.price * exchangeRate.rate).toString()
          : "",
      priceSource: "USD",
    }));
    setSearchTerm(selectedProduct.name);
    setShowSearchResults(false);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSearchResults(true);
    if (!e.target.value) {
      setForm(prev => ({ ...prev, productId: "" }));
    }
  };

  // Keyboard support for the article search (combobox pattern).
  useEffect(() => setActiveResult(-1), [searchTerm, showSearchResults]);
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setShowSearchResults(true);
      setActiveResult((index) => Math.min(index + 1, filteredProducts.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResult((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && showSearchResults && filteredProducts[activeResult]) {
      event.preventDefault();
      handleProductSelect(filteredProducts[activeResult]);
    } else if (event.key === "Escape") {
      setShowSearchResults(false);
    }
  };

  // Bring feedback into view: the checkout button may be far below it.
  useEffect(() => {
    if (message || error) feedbackRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [message, error]);

  // Check if adding to cart would result in negative stock
  const checkStockAfterAdd = (productId: string, quantityToAdd: number): boolean => {
    const productToCheck = products.find(p => p._id === productId);
    if (!productToCheck) return false;

    // Calculate current stock minus what's already in cart
    const currentCartQuantity = cart
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    return canAddCartQuantity(
      productToCheck.stock,
      currentCartQuantity,
      quantityToAdd
    );
  };

  // Toggle between USD and FC input modes
  const toggleCurrencyMode = () => {
    setForm(prev => ({
      ...prev,
      currencyMode: prev.currencyMode === "usd" ? "fc" : "usd",
    }));
  };

  const handleUsdPriceChange = (value: string) => {
    const usdPrice = parseFloat(value);
    setForm((prev) => ({
      ...prev,
      unitPrice: value,
      priceInFC:
        exchangeRate && Number.isFinite(usdPrice)
          ? Math.round(usdPrice * exchangeRate.rate).toString()
          : "",
      priceSource: "USD",
    }));
  };

  const handleFcPriceChange = (value: string) => {
    const fcPrice = parseFloat(value);
    setForm((prev) => ({
      ...prev,
      priceInFC: value,
      unitPrice:
        exchangeRate && Number.isFinite(fcPrice)
          ? (fcPrice / exchangeRate.rate).toString()
          : "",
      priceSource: "FC",
    }));
  };

  // Populate a missing equivalent when the rate arrives without changing
  // which manually entered currency owns the price.
  useEffect(() => {
    if (!exchangeRate) return;

    setForm((prev) => {
      if (prev.priceSource === "USD" && prev.unitPrice && !prev.priceInFC) {
        return {
          ...prev,
          priceInFC: Math.round(
            parseFloat(prev.unitPrice) * exchangeRate.rate
          ).toString(),
        };
      }

      if (prev.priceSource === "FC" && prev.priceInFC && !prev.unitPrice) {
        return {
          ...prev,
          unitPrice: (
            parseFloat(prev.priceInFC) / exchangeRate.rate
          ).toString(),
        };
      }

      return prev;
    });
  }, [exchangeRate]);

  // Stock information by role: admins see exact quantities, other roles a
  // status only (unchanged thresholds).
  const renderStockInfo = (product: Product): { label: string; tone: "success" | "warning" | "danger" } => {
    if (product.stock === 0) {
      return { label: isAdmin ? `Stock : ${product.stock}` : "En rupture", tone: "danger" };
    } else if (product.stock <= 5) { // You can adjust this threshold
      return { label: isAdmin ? `Stock : ${product.stock}` : "Stock faible", tone: "warning" };
    }
    return { label: isAdmin ? `Stock : ${product.stock}` : "En stock", tone: "success" };
  };

  // Available-stock message for the selected article, by role.
  const renderAvailableStockMessage = (product: Product, quantity: number) => {
    const canAddToCart = product && quantity > 0 && checkStockAfterAdd(product._id, quantity);
    
    if (isAdmin) {
      // Admin sees exact numbers
      const currentCartQuantity = cart
        .filter(item => item.productId === product._id)
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const availableStock = product.stock - currentCartQuantity;
      
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 num" aria-live="polite">
          <span>Stock disponible : <strong className="text-gray-900">{product.stock}</strong></span>
          {currentCartQuantity > 0 && (
            <span className="text-blue-700">Déjà dans le panier : {currentCartQuantity}</span>
          )}
          {quantity > 0 && (
            <span className={`inline-flex items-center gap-1 ${canAddToCart ? "text-green-700" : "text-red-700"}`}>
              {canAddToCart ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <XCircle className="w-4 h-4" aria-hidden="true" />}
              Stock restant après vente :{" "}
              {availableStock - quantity >= 0
                ? availableStock - quantity
                : "pas assez de stock"}
            </span>
          )}
        </div>
      );
    } else {
      // Staff sees status messages
      const status =
        product.stock === 0
          ? { tone: "danger", text: "En rupture de stock" }
          : product.stock <= 5
          ? { tone: "warning", text: "Stock faible" }
          : quantity > 0 && !canAddToCart
          ? { tone: "danger", text: "Quantité demandée non disponible" }
          : quantity > 0
          ? { tone: "success", text: "Stock suffisant" }
          : { tone: "success", text: "En stock" };
      const Icon = status.tone === "success" ? CheckCircle2 : status.tone === "warning" ? AlertTriangle : XCircle;
      return (
        <span className={`badge badge-${status.tone}`} aria-live="polite">
          <Icon aria-hidden="true" />{status.text}
        </span>
      );
    }
  };

  function handleAddToCart() {
    // Comprehensive validation
    if (!product) {
      setError("Veuillez sélectionner un produit");
      return;
    }

    if (quantity <= 0) {
      setError("La quantité doit être supérieure à zéro");
      return;
    }

    if (!currentPrice) {
      setError("Le prix unitaire doit être supérieur à zéro");
      return;
    }

    // Check if adding this quantity would result in negative stock
    if (!checkStockAfterAdd(product._id, quantity)) {
      setError("Stock insuffisant pour ajouter cette quantité au panier");
      return;
    }

    // Clear any previous errors
    setError(null);

    const unitPrice = currentPrice.priceUSD;

    // Check if product with same ID AND same price already exists in cart
    const existingItemIndex = cart.findIndex(
      (item) =>
        item.productId === product._id &&
        item.enteredCurrency === currentPrice.enteredCurrency &&
        item.enteredPrice === currentPrice.enteredPrice &&
        item.exchangeRate === currentPrice.exchangeRate
    );

    if (existingItemIndex >= 0) {
      // Update existing item (same product + same price)
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + quantity,
        total:
          (updatedCart[existingItemIndex].quantity + quantity) *
          updatedCart[existingItemIndex].unitPrice,
      };
      setCart(updatedCart);
    } else {
      // Add new item (either different product OR same product but different price)
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
          ...currentPrice,
        },
      ]);
    }

    // Reset form fields
    setForm((f) => ({
      ...f,
      quantity: "",
      unitPrice: product.price ? product.price.toString() : "",
      priceInFC:
        product.price && exchangeRate
          ? Math.round(product.price * exchangeRate.rate).toString()
          : "",
      priceSource: "USD",
    }));
    setSearchTerm("");
  }

  function removeFromCart(index: number) {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);

  }

  // Cart quantity stepper: same stock guard and line-total formula as
  // adding the same article again with handleAddToCart.
  function changeCartQuantity(index: number, delta: 1 | -1) {
    const item = cart[index];
    if (!item) return;
    const nextQuantity = item.quantity + delta;
    if (nextQuantity < 1) return;
    if (delta > 0 && !checkStockAfterAdd(item.productId, delta)) {
      setError("Stock insuffisant pour ajouter cette quantité au panier");
      return;
    }
    setError(null);
    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      quantity: nextQuantity,
      total: nextQuantity * item.unitPrice,
    };
    setCart(updatedCart);
  }

  function authHeader(): Record<string, string> {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Print function for receipt only - UPDATED for 80mm thermal paper
  const printReceiptOnly = () => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      printWindow.document.write(`
<html>
  <head>
    <title>Sale Receipt</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body { 
        font-family: 'Courier New', Courier, monospace; 
        margin: 0; 
        padding: 0; 
        font-size: 12px;
        font-weight: bold;
        line-height: 1.2;
        width: 80mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .receipt-container {
        width: 78mm;
        margin: 0 auto;
        padding: 1mm 2mm;
        border: none;
        text-align: center;
        position: relative;
      }
      .logo-watermark {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('${window.location.origin}/logo.jpeg');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 65%;
        opacity: 0.18;
        pointer-events: none;
        z-index: 0;
      }
      .content-wrapper {
        position: relative;
        z-index: 1;
      }
      .header {
        text-align: center;
        margin-bottom: 2mm;
        padding-bottom: 1mm;
        border-bottom: 2px double #000;
      }
      .shop-name {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 10px;
        margin-bottom: 0.3mm;
        line-height: 1.2;
        font-weight: bold;
      }
      .receipt-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
        text-align: left;
      }
      .receipt-title {
        font-size: 11px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm 2mm;
        border-radius: 2px;
        text-align: center;
      }
      .items-section {
        margin: 0;
        padding: 0;
        background-color: #fafafa;
        border: none;
        border-top: none;
      }
      .items-col-header {
        display: flex;
        justify-content: space-between;
        background-color: #e0e0e0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 10px;
        margin: 0;
        border-bottom: 1px solid #999;
      }
      .col-article {
        flex: 2;
        text-align: left;
      }
      .col-qte {
        width: 10mm;
        text-align: center;
      }
      .col-pu {
        width: 18mm;
        text-align: right;
      }
      .col-pt {
        width: 18mm;
        text-align: right;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0.5mm 2mm;
        border-bottom: 1px dotted #ddd;
        font-size: 10px;
      }
      .item-name {
        flex: 2;
        text-align: left;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 1mm;
      }
      .item-quantity {
        width: 10mm;
        text-align: center;
        font-weight: bold;
      }
      .item-unit-price {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .item-line-total {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 2mm;
        padding: 1mm 2mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        font-size: 11px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 11px;
        color: #000;
      }
      .footer { 
        text-align: center; 
        margin-top: 2mm; 
        font-size: 10px;
        font-weight: bold;
        padding: 1mm 2mm;
        background-color: #f8f8f8;
        border-top: 1px dashed #000;
      }
      .sales-person {
        margin-top: 2mm;
        text-align: center;
        font-weight: bold;
        font-size: 10px;
        padding: 1mm 2mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .receipt-qr {
        text-align: center;
        margin: 2mm auto;
        padding: 1mm;
        background: #fff;
      }
      .receipt-qr img {
        width: 42mm;
        height: 42mm;
        image-rendering: pixelated;
      }
      .qr-promo {
        margin-top: 0.5mm;
        font-size: 9px;
        line-height: 1.15;
        text-align: center;
      }
      .customer-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-align: left;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 10px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 10px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 2mm 0 0 0;
        font-weight: bold;
        font-size: 10px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 10px;
      }
      .warning {
        font-size: 9px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 80mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 80mm !important;
          font-size: 12px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 1mm 2mm !important;
          width: 78mm !important;
        }
        .cut-line {
          page-break-after: always !important;
          margin-bottom: 0 !important;
        }
        body::after,
        body::before {
          display: none !important;
          content: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${receiptData.shopName}</strong></div>
        <div class="shop-details"><strong>${receiptData.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${receiptData.shopNumber}</strong></div>
        <div class="shop-details"><strong>${receiptData.shopRegistration}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${receiptData.date}</strong></div>
        <div class="shop-details">RECU #: <strong>${receiptData.receiptNumber}</strong></div>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${receiptData.customerName.toUpperCase()}</strong></div>
        ${
          receiptData.customerPhone
            ? `<div class="customer-field">TELEPHONE: <strong>${receiptData.customerPhone}</strong></div>`
            : ""
        }
      </div>

      <div class="receipt-title">ARTICLES ACHETES</div>
      
      <div class="items-col-header">
        <span class="col-article">Article</span>
        <span class="col-qte">Qte</span>
      </div>
      
      <div class="items-section">
      ${receiptData.items
        .map(
          (item: CartItem) => `
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${item.name}</strong></div>
          <div class="item-quantity"><strong>${item.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${item.quantity} x ${compactDualUnit(item, receiptData.exchangeRate)} = ${compactDualTotal(item, receiptData.exchangeRate)}</strong></div>
        </div>
      `
        )
        .join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>${compactDualSaleTotal(receiptData.total, receiptData.items, receiptData.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>TOTAL:</strong></div>
          <div><strong>${compactDualSaleTotal(receiptData.total, receiptData.items, receiptData.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${receiptData.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${receiptData.salesPerson.toUpperCase()}</strong>
      </div>

      ${receiptData.qrDataUrl ? `<div class="receipt-qr"><img src="${receiptData.qrDataUrl}" alt="QR de contrôle du paiement" /><div class="qr-promo"><div><strong>UN SYSTÈME POUR VOTRE BOUTIQUE OU ENTREPRISE ?</strong></div><div>Gestion, ventes, stock & bien plus</div><div><strong>WhatsApp : +243 844 311 550</strong></div></div></div>` : ""}
      
      <div class="footer">
        <div class="thank-you"><strong>${receiptData.receiptFooter || "MERCI POUR VOTRE ACHAT !"}</strong></div>
        <div class="warning"><strong>Article non echangeable</strong></div>
        <div class="warning"><strong>Non remboursable</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
      </div>
    </div>
    <script>
      window.onload = function() {
        try {
          window.print();
        } catch(e) {
          console.error('Print error:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    </script>
  </body>
</html>
`);
      printWindow.document.close();
    }
  };

  // Print function for stub only - UPDATED for 80mm thermal paper
  const printStubOnly = () => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (printWindow) {
      printWindow.document.write(`
<html>
  <head>
    <title>Sale Stub</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body { 
        font-family: 'Courier New', Courier, monospace; 
        margin: 0; 
        padding: 0; 
        font-size: 12px;
        font-weight: bold;
        line-height: 1.2;
        width: 80mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .stub-container {
        width: 78mm;
        margin: 0 auto;
        padding: 1mm 2mm;
        border: none;
        text-align: center;
        position: relative;
      }
      .logo-watermark {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: url('${window.location.origin}/logo.jpeg');
        background-repeat: no-repeat;
        background-position: center;
        background-size: 65%;
        opacity: 0.18;
        pointer-events: none;
        z-index: 0;
      }
      .content-wrapper {
        position: relative;
        z-index: 1;
      }
      .header {
        text-align: center;
        margin-bottom: 2mm;
        padding-bottom: 1mm;
        border-bottom: 2px double #000;
      }
      .shop-name {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 10px;
        margin-bottom: 0.3mm;
        line-height: 1.2;
        font-weight: bold;
      }
      .receipt-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
        text-align: left;
      }
      .receipt-title {
        font-size: 11px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm 2mm;
        border-radius: 2px;
        text-align: center;
      }
      .stub-number {
        font-size: 11px;
        font-weight: bold;
        margin: 2mm 0;
        text-transform: uppercase;
        background-color: #333;
        color: white;
        padding: 1mm 2mm;
        border-radius: 3px;
      }
      .items-section {
        margin: 0;
        padding: 0;
        background-color: #fafafa;
        border: none;
        border-top: none;
      }
      .items-col-header {
        display: flex;
        justify-content: space-between;
        background-color: #e0e0e0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 10px;
        margin: 0;
        border-bottom: 1px solid #999;
      }
      .col-article {
        flex: 2;
        text-align: left;
      }
      .col-qte {
        width: 10mm;
        text-align: center;
      }
      .col-pu {
        width: 18mm;
        text-align: right;
      }
      .col-pt {
        width: 18mm;
        text-align: right;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0.5mm 2mm;
        border-bottom: 1px dotted #ddd;
        font-size: 10px;
      }
      .item-name {
        flex: 2;
        text-align: left;
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 1mm;
      }
      .item-quantity {
        width: 10mm;
        text-align: center;
        font-weight: bold;
      }
      .item-unit-price {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .item-line-total {
        width: 18mm;
        text-align: right;
        font-weight: bold;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 2mm;
        padding: 1mm 2mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        font-size: 11px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 11px;
      }
      .stub-footer { 
        text-align: center; 
        margin-top: 2mm; 
        font-size: 10px;
        font-weight: bold;
        padding: 1mm 2mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      .sales-person {
        margin-top: 2mm;
        text-align: center;
        font-weight: bold;
        font-size: 10px;
        padding: 1mm 2mm;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 2px;
      }
      .receipt-qr {
        text-align: center;
        margin: 2mm auto;
        padding: 1mm;
        background: #fff;
      }
      .receipt-qr img {
        width: 42mm;
        height: 42mm;
        image-rendering: pixelated;
      }
      .qr-promo {
        margin-top: 0.5mm;
        font-size: 9px;
        line-height: 1.15;
        text-align: center;
      }
      .customer-info {
        margin: 2mm 0;
        padding: 1mm 2mm;
        font-weight: bold;
        text-align: left;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 10px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 10px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 2mm 0 0 0;
        font-weight: bold;
        font-size: 10px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 10px;
      }
      .warning {
        font-size: 9px;
        color: #000;
        margin: 0.3mm 0;
        font-weight: bold;
      }
      .section-divider {
        height: 2px;
        background: linear-gradient(to right, transparent, #000, transparent);
        margin: 1mm 0;
      }
      @media print {
        @page {
          margin: 0 !important;
          size: 80mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 80mm !important;
          font-size: 12px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .stub-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 1mm 2mm !important;
          width: 78mm !important;
        }
        .cut-line {
          page-break-after: always !important;
          margin-bottom: 0 !important;
        }
        body::after,
        body::before {
          display: none !important;
          content: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="stub-container">
      <div class="logo-watermark"></div>
      <div class="content-wrapper">
      <div class="header">
        <div class="shop-name"><strong>${receiptData.shopName}</strong></div>
        <div class="shop-details"><strong>${receiptData.shopAddress}</strong></div>
        <div class="shop-details">TEL: <strong>${receiptData.shopNumber}</strong></div>
      </div>
      
      <div class="section-divider"></div>
      
      <div class="receipt-info">
        <div class="shop-details">DATE: <strong>${receiptData.date}</strong></div>
        <div class="shop-details">RECU #: <strong>${receiptData.receiptNumber}</strong></div>
      </div>
      
      <div class="stub-number">
        SOUCHE N°<strong>${receiptData.stubNumber}</strong>
      </div>
      
      <div class="customer-info">
        <div class="customer-field">CLIENT: <strong>${receiptData.customerName.toUpperCase()}</strong></div>
        ${
          receiptData.customerPhone
            ? `<div class="customer-field">TELEPHONE: <strong>${receiptData.customerPhone}</strong></div>`
            : ""
        }
      </div>

      <div class="receipt-title">ARTICLES VENDUS</div>
      
      <div class="items-col-header">
        <span class="col-article">Article</span>
        <span class="col-qte">Qte</span>
      </div>
      
      <div class="items-section">
      ${receiptData.items
        .map(
          (item: CartItem) => `
        <div class="item-row" style="flex-wrap:wrap">
          <div class="item-name"><strong>${item.name}</strong></div>
          <div class="item-quantity"><strong>${item.quantity}</strong></div>
          <div style="width:100%;text-align:left;padding-left:2mm"><strong>${item.quantity} x ${compactDualUnit(item, receiptData.exchangeRate)} = ${compactDualTotal(item, receiptData.exchangeRate)}</strong></div>
        </div>
      `
        )
        .join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>TOTAL VENTE:</strong></div>
          <div><strong>${compactDualSaleTotal(receiptData.total, receiptData.items, receiptData.exchangeRate)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${receiptData.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${receiptData.salesPerson.toUpperCase()}</strong>
      </div>

      ${receiptData.qrDataUrl ? `<div class="receipt-qr"><img src="${receiptData.qrDataUrl}" alt="QR de contrôle du paiement" /><div class="qr-promo"><div><strong>UN SYSTÈME POUR VOTRE BOUTIQUE OU ENTREPRISE ?</strong></div><div>Gestion, ventes, stock & bien plus</div><div><strong>WhatsApp : +243 844 311 550</strong></div></div></div>` : ""}
      
      <div class="stub-footer">
        <div class="thank-you"><strong>SOUCHE DE CAISSE</strong></div>
        <div class="warning"><strong>${receiptData.shopName}</strong></div>
        <div class="warning"><strong>Conserver cette souche</strong></div>
        <div class="warning">Recu #: <strong>${receiptData.receiptNumber}</strong></div>
        <div class="warning">Date: <strong>${receiptData.date}</strong></div>
      </div>

      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
      </div>
      </div>
    </div>
    <script>
      window.onload = function() {
        try {
          window.print();
        } catch(e) {
          console.error('Print error:', e);
        }
        setTimeout(() => {
          window.close();
        }, 1000);
      };
    </script>
  </body>
</html>
`);
      printWindow.document.close();
    }
  };

  // Sequential printing function
  const printSequentially = () => {
    // Print receipt first
    printReceiptOnly();

    // Wait 2 seconds then print stub
    setTimeout(() => {
      printStubOnly();
    }, 2000);
  };

  // ESC/POS printing function
  const printWithESCPOS = async (receiptData: any) => {
    try {
      console.log("Attempting ESC/POS printing...");
      // Print receipt
      await PrintService.printReceipt(receiptData, "sale");
      // Print stub
      await PrintService.printStub(receiptData, "sale");
      console.log("ESC/POS printing successful");
      return true;
    } catch (error: any) {
      console.error(
        "ESC/POS printing failed, falling back to browser printing:",
        error
      );
      // Fallback to sequential browser printing
      printSequentially();
      return false;
    }
  };

  useEffect(() => {
    if (receiptData) {
      // Small delay to ensure the receipt data is set
      const timer = setTimeout(async () => {
        try {
          // Try ESC/POS printing first, fallback to sequential browser printing
          await printWithESCPOS(receiptData);
        } catch (error) {
          console.error("Printing failed:", error);
          // Last resort: try sequential browser printing directly
          printSequentially();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [receiptData]);

  async function handleSale(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const body = {
        // Walk-in: optional display name only (no phone, no customer record).
        customer: buildSaleCustomer(form),
        isWalkIn: form.isWalkIn,
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.unitPrice,
          enteredPrice: item.enteredPrice,
          enteredCurrency: item.enteredCurrency,
          priceUSD: item.priceUSD,
          priceFC: item.priceFC,
          exchangeRate: item.exchangeRate,
        })),
        subtotal: cartTotal,
        total: cartTotal,
        paymentMethod: uiToModelPayment(form.paymentMethod),
        salesPerson: currentUser?.username || "unknown",
        exchangeRate: cart[0]?.exchangeRate ?? exchangeRate?.rate,
      };

      const res = await fetch(`${API_BASE}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = await readJsonSafe(res);
      if (!res.ok) {
        const msg =
          (data as any)?.error ||
          (data as any)?.text ||
          `Sale failed (${res.status})`;
        throw new Error(msg);
      }

      if (!data.receiptToken) {
        throw new Error("Le serveur n'a pas retourné le QR sécurisé du reçu");
      }
      const qrDataUrl = await QRCode.toDataURL(data.receiptToken, {
        errorCorrectionLevel: "M",
        margin: 4,
        width: 320,
        color: { dark: "#000000", light: "#ffffff" },
      });

      // Get the sale ID from the API response
      const saleId = data.saleId || data._id;
      
      // Enhanced receipt data with better formatting - use actual sale ID
      const newReceiptData = {
        shopName: shopSettings.shopName,
        shopAddress: shopSettings.shopAddress,
        shopNumber: shopSettings.shopNumber,
        shopRegistration: shopSettings.shopRegistration,
        receiptFooter: shopSettings.receiptFooter,
        customerName: receiptCustomerName(form),
        customerPhone: form.isWalkIn ? "" : form.customerPhone,
        items: cart,
        total: cartTotal,
        paymentMethod: form.paymentMethod,
        salesPerson: currentUser?.username || "Agent",
        date: formatNowGMT2(),
        receiptNumber: saleId, // Use actual sale ID from API
        stubNumber: saleId, // Use actual sale ID from API for stub as well
        qrToken: data.receiptToken,
        qrDataUrl,
      };

      setReceiptData(newReceiptData);

      // Reset form and cart
      setForm({
        productId: "",
        quantity: "",
        unitPrice: "",
        priceInFC: "",
        customerName: "",
        customerPhone: "",
        isWalkIn: true,
        paymentMethod: form.paymentMethod,
        currencyMode: "usd",
        priceSource: "USD",
      });
      setCart([]);
      setSearchTerm("");
      // Fresh stock: an article that just reached 0 leaves the list at once.
      fetchSellableProducts().then(setProducts).catch((reloadError) => {
        console.warn("Could not refresh products after sale:", reloadError);
      });

      setMessage(
        "Vente effectuée avec succès. Impression du reçu et de la souche…"
      );
    } catch (e: any) {
      setError(e?.message || "La vente n'a pas pu être effectuée");
      // A refusal for stock or availability means the list is stale.
      fetchSellableProducts().then(setProducts).catch(() => undefined);
    } finally {
      setSubmitting(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatFc = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FC';
  };

  // Check if the product can be added to cart (comprehensive validation)
  const canAddToCart =
    product &&
    quantity > 0 &&
    currentPrice !== null &&
    checkStockAfterAdd(product._id, quantity);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const saleFcTotal = getSaleFcTotal(cartTotal, cart, exchangeRate?.rate);
  const hasFcEntries = cartOriginalTotals.FC > 0;
  const visibleResults = showSearchResults ? filteredProducts : [];
  const checkoutHint = cart.length === 0
    ? "Ajoutez au moins un article pour valider."
    : !isFormValid
    ? "Nom et téléphone du client enregistré requis."
    : null;

  const priceFormat = (item: CartItem) => item.enteredCurrency === "FC"
    ? { main: formatFc(item.enteredPrice), alt: `≈ ${formatCurrency(item.priceUSD)}` }
    : { main: formatCurrency(item.enteredPrice), alt: item.priceFC !== undefined ? `≈ ${formatFc(item.priceFC)}` : "" };
  const lineFormat = (item: CartItem) => item.enteredCurrency === "FC"
    ? { main: formatFc(item.enteredPrice * item.quantity), alt: `≈ ${formatCurrency(item.total)}` }
    : { main: formatCurrency(item.enteredPrice * item.quantity), alt: item.priceFC !== undefined ? `≈ ${formatFc(item.priceFC * item.quantity)}` : "" };

  const submitButton = (className: string) => (
    <button
      type="button"
      onClick={handleSale}
      disabled={!isFormValid || submitting}
      className={`btn btn-success btn-lg ${className}`}
      aria-describedby={checkoutHint ? "pos-checkout-hint" : undefined}
    >
      {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      {submitting ? "Enregistrement…" : "Valider la vente"}
    </button>
  );

  return (
    <div className="page page-wide">
      <PageHeader
        title="Nouvelle vente"
        description="Client, articles, panier puis encaissement."
        actions={<ExchangeRateChip loading={loadingRate} rate={exchangeRate} />}
      />

      {(message || error) && (
        <div ref={feedbackRef} className="grid gap-2 mb-4" style={{ scrollMarginTop: "1rem", scrollMarginBottom: "6rem" }}>
          {message && (
            <div className="alert alert-success" role="status"><CheckCircle2 aria-hidden="true" /><span>{message}</span></div>
          )}
          {error && (
            <div className="alert alert-danger" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>
          )}
        </div>
      )}

      <div className="pos-grid">
        <div className="pos-main">
        {/* 1 — Customer */}
        <section className="card pos-area-customer" aria-labelledby="pos-customer-title">
          <div className="card-header">
            <h2 id="pos-customer-title" className="section-title"><span className="pos-step" aria-hidden="true">1</span>Client</h2>
            <div className="segmented" role="group" aria-label="Type de client">
              <button type="button" aria-pressed={form.isWalkIn} onClick={() => setCustomerType(true)}>
                <UserRound aria-hidden="true" />De passage
              </button>
              <button type="button" aria-pressed={!form.isWalkIn} onClick={() => setCustomerType(false)}>
                <IdCard aria-hidden="true" />Enregistré
              </button>
            </div>
          </div>
          <div className="card-body grid gap-4">
            {form.isWalkIn ? (
              <div className="field">
                <label htmlFor="pos-walkin-name" className="field-label">
                  Nom du client <span className="opt">(facultatif)</span>
                </label>
                <input
                  id="pos-walkin-name"
                  type="text"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Client de passage"
                  autoComplete="off"
                  maxLength={80}
                  className="input"
                  aria-describedby="pos-walkin-hint"
                />
                <p id="pos-walkin-hint" className="field-hint">
                  Aucun téléphone requis. Le nom figure sur le reçu ; aucune fiche client n'est créée.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 pos-customer-fields">
                <div className="field">
                  <label htmlFor="pos-customer-name" className="field-label">
                    Nom du client <span className="req" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="pos-customer-name"
                    type="text"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="Nom complet"
                    autoComplete="off"
                    className="input"
                    required
                    aria-required="true"
                  />
                </div>
                <div className="field">
                  <label htmlFor="pos-customer-phone" className="field-label">
                    Téléphone <span className="req" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="pos-customer-phone"
                    type="tel"
                    inputMode="tel"
                    name="customerPhone"
                    value={form.customerPhone}
                    onChange={handleChange}
                    placeholder="+243 …"
                    autoComplete="off"
                    className="input"
                    required
                    aria-required="true"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2 — Articles */}
        <section className="card pos-area-products" aria-labelledby="pos-products-title">
          <div className="card-header">
            <h2 id="pos-products-title" className="section-title"><span className="pos-step" aria-hidden="true">2</span>Ajouter un article</h2>
            {loadingProducts && <span className="badge"><Loader2 className="animate-spin" aria-hidden="true" />Chargement…</span>}
          </div>
          <div className="card-body grid gap-4">
            <div className="field relative" ref={searchRef}>
              <label htmlFor="pos-search" className="field-label">Article</label>
              <div className="input-group">
                <Search aria-hidden="true" />
                <input
                  id="pos-search"
                  type="search"
                  role="combobox"
                  aria-expanded={visibleResults.length > 0}
                  aria-controls="pos-search-results"
                  aria-autocomplete="list"
                  aria-activedescendant={activeResult >= 0 ? `pos-result-${activeResult}` : undefined}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchResults(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={loadingProducts ? "Chargement des articles…" : "Nom ou référence de l'article"}
                  autoComplete="off"
                  className="input"
                  disabled={loadingProducts || products.length === 0}
                />
              </div>

              {visibleResults.length > 0 && (
                <div id="pos-search-results" role="listbox" aria-label="Articles trouvés" className="pos-results">
                  {visibleResults.map((result, index) => {
                    const stock = renderStockInfo(result);
                    return (
                      <button
                        type="button"
                        role="option"
                        id={`pos-result-${index}`}
                        aria-selected={index === activeResult}
                        key={result._id}
                        className="pos-result"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleProductSelect(result)}
                      >
                        <span className="min-w-0">
                          <strong className="truncate">{result.name}</strong>
                          {result.sku && <small>Réf. {result.sku}</small>}
                        </span>
                        <span className={`badge badge-${stock.tone} num`}>{stock.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {showSearchResults && searchTerm && filteredProducts.length === 0 && (
                <div className="pos-results" role="status">
                  <p className="px-3 py-4 text-center text-sm text-gray-500">Aucun article ne correspond à « {searchTerm} ».</p>
                </div>
              )}
            </div>

            {!loadingProducts && products.length === 0 && (
              <div className="alert alert-warning"><PackageX aria-hidden="true" /><span>Aucun article disponible à la vente pour le moment.</span></div>
            )}

            {product && (
              <div className="pos-selected">
                <Package className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1 grid gap-1 justify-items-start">
                  <strong className="text-sm font-semibold text-gray-900 truncate max-w-full">{product.name}</strong>
                  {renderAvailableStockMessage(product, quantity)}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="pos-quantity" className="field-label">Quantité</label>
                <input
                  id="pos-quantity"
                  type="number"
                  inputMode="numeric"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className="input num"
                  min={1}
                />
              </div>

              <div className="field">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="pos-price" className="field-label">
                    Prix unitaire <span className="sr-only">en {form.currencyMode === "usd" ? "USD" : "FC"}</span>
                  </label>
                  <div className="segmented pos-currency" role="group" aria-label="Devise de saisie du prix">
                    <button type="button" aria-pressed={form.currencyMode === "usd"} onClick={() => form.currencyMode !== "usd" && toggleCurrencyMode()}>USD</button>
                    <button type="button" aria-pressed={form.currencyMode === "fc"} onClick={() => form.currencyMode !== "fc" && toggleCurrencyMode()}>FC</button>
                  </div>
                </div>
                {form.currencyMode === "usd" ? (
                  <input
                    id="pos-price"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    name="unitPrice"
                    value={form.unitPrice}
                    onChange={(e) => canEditPrice && handleUsdPriceChange(e.target.value)}
                    readOnly={!canEditPrice}
                    placeholder={product?.price ? `ex : ${product.price}` : "Prix en USD"}
                    className="input num"
                    min={0.01}
                    aria-describedby="pos-price-hint"
                  />
                ) : (
                  <input
                    id="pos-price"
                    type="number"
                    inputMode="numeric"
                    name="priceInFC"
                    value={form.priceInFC}
                    onChange={(e) => canEditPrice && handleFcPriceChange(e.target.value)}
                    readOnly={!canEditPrice}
                    placeholder="Prix en FC"
                    className="input num"
                    min={1}
                    aria-describedby="pos-price-hint"
                  />
                )}
                <p id="pos-price-hint" className="field-hint num flex flex-wrap gap-x-3 gap-y-1">
                  {!canEditPrice && <span className="inline-flex items-center gap-1 text-amber-700"><Lock className="w-3 h-3" aria-hidden="true" />Prix verrouillé (permission requise)</span>}
                  {form.unitPrice && form.currencyMode === "usd" && exchangeRate && (
                    <>≈ {formatFc(parseFloat(form.unitPrice) * exchangeRate.rate)}</>
                  )}
                  {form.priceInFC && form.currencyMode === "fc" && exchangeRate && (
                    <>≈ {formatCurrency(parseFloat(form.priceInFC) / exchangeRate.rate)}</>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="btn btn-primary btn-lg w-full sm:w-auto sm:justify-self-start"
            >
              <Plus aria-hidden="true" />
              Ajouter au panier
            </button>
          </div>
        </section>

        </div>

        <div className="pos-side">
        {/* 3 — Cart */}
        <section className="card pos-area-cart" aria-labelledby="pos-cart-title">
          <div className="card-header">
            <h2 id="pos-cart-title" className="section-title"><span className="pos-step" aria-hidden="true">3</span>Panier</h2>
            <span className="badge num" aria-live="polite">{cartCount} pièce{cartCount > 1 ? "s" : ""}</span>
          </div>
          <div className="card-body">
            {cart.length === 0 ? (
              <EmptyState title="Le panier est vide" icon={<ShoppingCart aria-hidden="true" />}>
                Recherchez un article, indiquez la quantité puis ajoutez-le au panier.
              </EmptyState>
            ) : (
              <ul className="pos-cart-list" aria-label="Articles du panier">
                {cart.map((item, index) => {
                  const unit = priceFormat(item);
                  const line = lineFormat(item);
                  return (
                    <li key={index} className="pos-cart-item">
                      <div className="min-w-0">
                        <h3>{item.name}</h3>
                        <div className="line-meta">{unit.main}{unit.alt && <> · {unit.alt}</>} / pièce</div>
                      </div>
                      <div className="line-total">
                        {line.main}
                        {line.alt && <div className="line-meta font-normal">{line.alt}</div>}
                      </div>
                      <div className="pos-qty" role="group" aria-label={`Quantité de ${item.name}`}>
                        <button type="button" onClick={() => changeCartQuantity(index, -1)} disabled={item.quantity <= 1} aria-label={`Retirer une pièce de ${item.name}`}>
                          <Minus aria-hidden="true" />
                        </button>
                        <output aria-live="polite">{item.quantity}</output>
                        <button type="button" onClick={() => changeCartQuantity(index, 1)} aria-label={`Ajouter une pièce de ${item.name}`}>
                          <Plus aria-hidden="true" />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(index)} className="btn btn-ghost btn-sm justify-self-end text-red-700" aria-label={`Enlever ${item.name} du panier`}>
                        <Trash2 aria-hidden="true" />Enlever
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* 4 — Payment & validation */}
        <section className="card pos-area-payment" aria-labelledby="pos-payment-title">
          <div className="card-header">
            <h2 id="pos-payment-title" className="section-title"><span className="pos-step" aria-hidden="true">4</span>Encaissement</h2>
          </div>
          <div className="card-body grid gap-4">
            <div className="field">
              <label htmlFor="pos-payment-method" className="field-label">Méthode de paiement</label>
              <select
                id="pos-payment-method"
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa ou Airtel Money (Transfert)</option>
                <option value="bank">Transfert Bank</option>
                <option value="card">Carte Visa</option>
                <option value="other">Autres</option>
              </select>
            </div>

            <div className="pos-total" aria-live="polite">
              {hasFcEntries && cartOriginalTotals.USD > 0 && (
                <div className="pos-total-row"><span>Saisi en USD</span><span>{formatCurrency(cartOriginalTotals.USD)}</span></div>
              )}
              {hasFcEntries && (
                <div className="pos-total-row"><span>Saisi en FC</span><span>{formatFc(cartOriginalTotals.FC)}</span></div>
              )}
              <div className="pos-total-row is-grand"><span>{hasFcEntries ? "Total reçu" : "Total"}</span><strong>{formatCurrency(cartTotal)}</strong></div>
              {saleFcTotal !== undefined && cart.length > 0 && (
                <div className="pos-total-row"><span>Équivalent</span><span>≈ {formatFc(saleFcTotal)}</span></div>
              )}
            </div>

            <div className="pos-submit-inline grid">
              {submitButton("btn-block")}
            </div>
            {checkoutHint && <p id="pos-checkout-hint" className="field-hint text-center">{checkoutHint}</p>}
          </div>
        </section>

        </div>

        {/* Phones & tablets: total and validation always within reach. */}
        <div className="pos-checkout-bar">
          <div className="summary">
            <small className="truncate">{cartCount} pièce{cartCount > 1 ? "s" : ""} · {form.isWalkIn ? form.customerName.trim() || "Client de passage" : form.customerName.trim() || "Client enregistré"}</small>
            <strong>{formatCurrency(cartTotal)}</strong>
          </div>
          {submitButton("")}
        </div>
      </div>

      {/* Hidden receipt container (keep as fallback) */}
      <div ref={receiptRef} style={{ display: "none" }} />
    </div>
  );
}
