/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState, useRef } from "react";
import { formatNowGMT2, formatDateGMT2 } from "../utils/dateUtils";
import { useAuth } from "../hooks/useAuth";
import { DollarSign, RefreshCw, Calculator, Search } from "lucide-react";
import { serverUrl } from "../utils/constants";
import QRCode from "qrcode";
import {
  canAddCartQuantity,
  createPriceSnapshot,
  type PriceSnapshot,
  type SaleCurrency,
} from "../utils/salePricing";

interface Product {
  _id: string;
  name: string;
  sku?: string;
  stock: number;
  price?: number;
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

// Simplified Print service for ESC/POS printing
class PrintService {
  static async printReceipt(
    receiptData: any,
    type: "sale" | "reservation" = "sale"
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
    type: "sale" | "reservation" = "sale"
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
    isWalkIn: false,
    paymentMethod: "cash" as UiPayment,
    currencyMode: "usd" as "usd" | "fc",
    priceSource: "USD" as SaleCurrency,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const res = await fetch(`${API_BASE}/products`, {
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

  const isFormValid =
    cart.length > 0 &&
    (form.isWalkIn ||
      (form.customerName.trim() !== "" && form.customerPhone.trim() !== ""));

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function toggleWalkIn() {
    setForm((f) => ({
      ...f,
      isWalkIn: !f.isWalkIn,
      customerName: "",
      customerPhone: "",
    }));
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

  // Function to display stock information based on user role
  const renderStockInfo = (product: Product) => {
    if (isAdmin) {
      // Admin sees exact stock numbers
      return `(Stock: ${product.stock})`;
    } else {
      // Staff sees stock status instead of exact numbers
      if (product.stock === 0) {
        return "(En rupture)";
      } else if (product.stock <= 5) { // You can adjust this threshold
        return "(Stock faible)";
      } else {
        return "(En stock)";
      }
    }
  };

  // Function to display available stock message based on user role
  const renderAvailableStockMessage = (product: Product, quantity: number) => {
    const canAddToCart = product && quantity > 0 && checkStockAfterAdd(product._id, quantity);
    
    if (isAdmin) {
      // Admin sees exact numbers
      const currentCartQuantity = cart
        .filter(item => item.productId === product._id)
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const availableStock = product.stock - currentCartQuantity;
      
      return (
        <p className="text-sm text-gray-600 mb-4">
          Stock disponible: <strong>{product.stock}</strong>
          {currentCartQuantity > 0 && (
            <span className="ml-2 text-blue-600">
              (Déjà dans panier: {currentCartQuantity})
            </span>
          )}
          {quantity > 0 && (
            <span className={`ml-4 ${canAddToCart ? 'text-green-600' : 'text-red-600'}`}>
              Stock restant après vente:{" "}
              {availableStock - quantity >= 0
                ? availableStock - quantity
                : "❌ pas assez de stock!"}
            </span>
          )}
        </p>
      );
    } else {
      // Staff sees status messages
      if (product.stock === 0) {
        return (
          <p className="text-sm text-red-600 mb-4">
            <strong>❌ En rupture de stock</strong>
          </p>
        );
      } else if (product.stock <= 5) {
        return (
          <p className="text-sm text-orange-600 mb-4">
            <strong>⚠️ Stock faible</strong>
          </p>
        );
      } else if (quantity > 0 && !canAddToCart) {
        return (
          <p className="text-sm text-red-600 mb-4">
            <strong>❌ Quantité demandée non disponible</strong>
          </p>
        );
      } else if (quantity > 0) {
        return (
          <p className="text-sm text-green-600 mb-4">
            <strong>✅ Stock suffisant</strong>
          </p>
        );
      } else {
        return (
          <p className="text-sm text-green-600 mb-4">
            <strong>✅ En stock</strong>
          </p>
        );
      }
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
        margin: 3mm auto;
        padding: 2mm;
        background: #fff;
      }
      .receipt-qr img {
        width: 42mm;
        height: 42mm;
        image-rendering: pixelated;
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
        <span class="col-pu">PU($)</span>
        <span class="col-pt">PT($)</span>
      </div>
      
      <div class="items-section">
      ${receiptData.items
        .map(
          (item: CartItem) => `
        <div class="item-row">
          <div class="item-name"><strong>${item.name}</strong></div>
          <div class="item-quantity"><strong>${item.quantity}</strong></div>
          <div class="item-unit-price"><strong>${item.enteredCurrency === "FC" ? `${item.enteredPrice.toLocaleString("fr-FR")} FC` : `$${item.enteredPrice.toFixed(2)}`}</strong></div>
          <div class="item-line-total"><strong>${item.enteredCurrency === "FC" ? `${(item.enteredPrice * item.quantity).toLocaleString("fr-FR")} FC` : `$${(item.enteredPrice * item.quantity).toFixed(2)}`}</strong></div>
        </div>
        ${item.enteredCurrency === "FC" ? `<div class="item-name">Équiv. USD: $${(item.priceUSD * item.quantity).toFixed(2)}</div>` : ""}
      `
        )
        .join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>SOUS-TOTAL:</strong></div>
          <div><strong>$${receiptData.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>TOTAL:</strong></div>
          <div><strong>$${receiptData.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${receiptData.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${receiptData.salesPerson.toUpperCase()}</strong>
      </div>

      ${receiptData.qrDataUrl ? `<div class="receipt-qr"><img src="${receiptData.qrDataUrl}" alt="QR de contrôle du paiement" /><div><strong>SCAN CONTROLE PAIEMENT</strong></div></div>` : ""}
      
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
        <span class="col-pu">PU($)</span>
        <span class="col-pt">PT($)</span>
      </div>
      
      <div class="items-section">
      ${receiptData.items
        .map(
          (item: CartItem) => `
        <div class="item-row">
          <div class="item-name"><strong>${item.name}</strong></div>
          <div class="item-quantity"><strong>${item.quantity}</strong></div>
          <div class="item-unit-price"><strong>${item.unitPrice.toFixed(2)}</strong></div>
          <div class="item-line-total"><strong>${item.total.toFixed(2)}</strong></div>
        </div>
      `
        )
        .join("")}
      </div>
      
      <div class="total-section">
        <div class="total-row">
          <div><strong>TOTAL VENTE:</strong></div>
          <div><strong>$${receiptData.total.toFixed(2)}</strong></div>
        </div>
        <div class="total-row">
          <div><strong>PAIEMENT:</strong></div>
          <div class="payment-method"><strong>${receiptData.paymentMethod.toUpperCase()}</strong></div>
        </div>
      </div>
      
      <div class="sales-person">
        Agent: <strong>${receiptData.salesPerson.toUpperCase()}</strong>
      </div>

      ${receiptData.qrDataUrl ? `<div style="text-align:center;margin:3mm auto;padding:2mm;background:#fff"><img src="${receiptData.qrDataUrl}" alt="QR de contrôle du paiement" style="width:42mm;height:42mm;image-rendering:pixelated" /><div><strong>SCAN CONTROLE PAIEMENT</strong></div></div>` : ""}
      
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
        customer: form.isWalkIn
          ? undefined
          : {
              name: form.customerName,
              phone: form.customerPhone,
              email: "",
            },
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
        customerName: form.isWalkIn ? "Client de passage" : form.customerName,
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
        isWalkIn: false,
        paymentMethod: form.paymentMethod,
        currencyMode: "usd",
        priceSource: "USD",
      });
      setCart([]);
      setSearchTerm("");

      setMessage(
        "✅ Vente effectuée avec succès ! Impression du reçu et de la souche..."
      );
    } catch (e: any) {
      setError(e?.message || "La vente n'a pas pu être effectuée");
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

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header with Exchange Rate */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Nouvelle Vente</h2>
              <p className="text-gray-600 mt-1">Créez une nouvelle vente avec gestion multi-devises</p>
            </div>
            
            {/* Exchange Rate Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[280px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Taux du jour:</span>
                </div>
                {loadingRate ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : exchangeRate ? (
                  <div className="text-right">
                    <div className="font-bold text-blue-800 text-lg">
                      1 USD = {new Intl.NumberFormat('fr-FR').format(exchangeRate.rate)} FC
                    </div>
                    <div className="text-xs text-blue-600">
                      Effectif depuis {formatDateGMT2(exchangeRate.effectiveFrom)}
                    </div>
                  </div>
                ) : (
                  <span className="text-red-600 text-sm">Taux non disponible</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Ajouter les articles</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative" ref={searchRef}>
              <label className="block mb-2 font-medium text-gray-700">Articles</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchResults(true)}
                  placeholder="Rechercher un article..."
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingProducts || products.length === 0}
                />
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600 flex justify-between">
                        <span>{product.sku && `SKU: ${product.sku}`}</span>
                        <span className={product.stock === 0 ? "text-red-600" : product.stock <= 5 ? "text-orange-600" : "text-green-600"}>
                          {renderStockInfo(product)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results Message */}
              {showSearchResults && searchTerm && filteredProducts.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  Aucun article trouvé
                </div>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">Nombre de pièces</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Entrer le nombre de pièces"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={1}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-medium text-gray-700">Prix unitaire</label>
                <button
                  type="button"
                  onClick={toggleCurrencyMode}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <Calculator className="w-3 h-3" />
                  {form.currencyMode === 'usd' ? 'USD → FC' : 'FC → USD'}
                </button>
              </div>
              
              {!canEditPrice && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-2">
                  Prix verrouillé — permission requise pour modifier les prix.
                </p>
              )}
              {form.currencyMode === 'usd' ? (
                <input
                  type="number"
                  step="0.01"
                  name="unitPrice"
                  value={form.unitPrice}
                  onChange={(e) => canEditPrice && handleUsdPriceChange(e.target.value)}
                  readOnly={!canEditPrice}
                  placeholder={product?.price ? `ex: ${product.price}` : "Entrer le prix en USD"}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPrice ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500" : "border-gray-300"}`}
                  min={0.01}
                />
              ) : (
                <input
                  type="number"
                  name="priceInFC"
                  value={form.priceInFC}
                  onChange={(e) => canEditPrice && handleFcPriceChange(e.target.value)}
                  readOnly={!canEditPrice}
                  placeholder="Entrer le prix en FC"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!canEditPrice ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500" : "border-gray-300"}`}
                  min={1}
                />
              )}
              
              {/* Conversion Display */}
              {form.unitPrice && form.currencyMode === 'usd' && exchangeRate && (
                <p className="text-xs text-green-600 mt-1">
                  ≈ {formatFc(parseFloat(form.unitPrice) * exchangeRate.rate)}
                </p>
              )}
              {form.priceInFC && form.currencyMode === 'fc' && exchangeRate && (
                <p className="text-xs text-green-600 mt-1">
                  ≈ {formatCurrency(parseFloat(form.priceInFC) / exchangeRate.rate)}
                </p>
              )}
            </div>
          </div>

          {product && renderAvailableStockMessage(product, quantity)}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
              canAddToCart
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-gray-400 cursor-not-allowed text-white"
            } transition-colors`}
          >
            <RefreshCw className="w-4 h-4" />
            Ajouter au panier
          </button>

          {cart.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Articles du panier</h3>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Articles</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Pièces</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Prix unitaire</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cart.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.enteredCurrency === "FC"
                            ? formatFc(item.enteredPrice)
                            : formatCurrency(item.enteredPrice)}
                          {item.enteredCurrency === "FC" ? (
                            <div className="text-xs text-gray-500">
                              ≈ {formatCurrency(item.priceUSD)}
                            </div>
                          ) : item.priceFC !== undefined ? (
                            <div className="text-xs text-gray-500">
                              ≈ {formatFc(item.priceFC)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.enteredCurrency === "FC"
                            ? formatFc(item.enteredPrice * item.quantity)
                            : formatCurrency(item.enteredPrice * item.quantity)}
                          {item.enteredCurrency === "FC" ? (
                            <div className="text-xs text-gray-500">
                              ≈ {formatCurrency(item.total)}
                            </div>
                          ) : item.priceFC !== undefined ? (
                            <div className="text-xs text-gray-500">
                              ≈ {formatFc(item.priceFC * item.quantity)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Enlever
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {cartOriginalTotals.USD > 0 && (
                          <div>{formatCurrency(cartOriginalTotals.USD)}</div>
                        )}
                        {cartOriginalTotals.FC > 0 && (
                          <div>{formatFc(cartOriginalTotals.FC)}</div>
                        )}
                        {cartOriginalTotals.FC > 0 && (
                          <div className="text-xs text-gray-500">
                            Total reçu ≈ {formatCurrency(cartTotal)}
                          </div>
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Informations du client</h3>

          <label className="flex items-center gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isWalkIn}
              onChange={toggleWalkIn}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              Client de passage (vente sans coordonnées client)
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Nom du client {!form.isWalkIn && "*"}
              </label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder={form.isWalkIn ? "Client de passage" : "Entrer le nom du client"}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                disabled={form.isWalkIn}
                required={!form.isWalkIn}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Numéro de téléphone du client {!form.isWalkIn && "*"}
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                placeholder={form.isWalkIn ? "—" : "Entrer le numéro de téléphone"}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                disabled={form.isWalkIn}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Méthode de paiement
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa ou Airtel Money (Transfert)</option>
                <option value="bank">Transfert Bank</option>
                <option value="card">Carte Visa</option>
                <option value="other">Autres</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            onClick={handleSale}
            disabled={!isFormValid || submitting}
            className={`px-8 py-3 rounded-lg font-medium text-lg ${
              isFormValid && !submitting
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                : "bg-gray-400 cursor-not-allowed text-white"
            } transition-colors`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                En cours d'enregistrement...
              </span>
            ) : (
              "Enregistrer la vente"
            )}
          </button>
        </div>

        {/* Hidden receipt container (keep as fallback) */}
        <div ref={receiptRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
