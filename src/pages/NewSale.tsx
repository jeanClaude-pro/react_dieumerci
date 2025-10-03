/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";

interface Product {
  _id: string;
  name: string;
  sku?: string;
  stock: number;
  price?: number;
}

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const API_BASE = import.meta.env.VITE_API_URL;

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
  const receiptRef = useRef<HTMLDivElement>(null);
  const [stubCounter, setStubCounter] = useState(1);
  const [receiptCounter, setReceiptCounter] = useState(1);

  // Get the current user from your auth context
  const { user: currentUser } = useAuth();

  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    unitPrice: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    paymentMethod: "cash" as UiPayment,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setLoadingProducts(true);
      setError(null);
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
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const product = useMemo(
    () => products.find((p) => p._id === form.productId),
    [products, form.productId]
  );

  const quantity = parseInt(form.quantity) || 0;
  const unitPrice = parseFloat(form.unitPrice) || 0;
  const itemTotal = quantity * unitPrice;
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const isFormValid =
    cart.length > 0 &&
    form.customerName.trim() !== "" &&
    form.customerPhone.trim() !== "";

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleAddToCart() {
    if (!product || quantity <= 0 || unitPrice <= 0) return;

    // Check if product with same ID AND same price already exists in cart
    const existingItemIndex = cart.findIndex(
      (item) => item.productId === product._id && item.unitPrice === unitPrice
    );

    if (existingItemIndex >= 0) {
      // Update existing item (same product + same price)
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + quantity,
        total: (updatedCart[existingItemIndex].quantity + quantity) * unitPrice,
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
          total: itemTotal,
        },
      ]);
    }

    // Update local product stock
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p._id === product._id ? { ...p, stock: p.stock - quantity } : p
      )
    );

    // Reset form fields
    setForm((f) => ({
      ...f,
      quantity: "",
      unitPrice: product.price ? product.price.toString() : "",
    }));
  }

  function removeFromCart(index: number) {
    const itemToRemove = cart[index];
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);

    // Restore stock when item is removed from cart
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p._id === itemToRemove.productId
          ? { ...p, stock: p.stock + itemToRemove.quantity }
          : p
      )
    );
  }

  function authHeader(): Record<string, string> {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Print function for receipt only
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
        font-size: 13px;
        font-weight: bold;
        line-height: 1.1;
        width: 72mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        justify-content: center;
      }
      .receipt-container { 
        width: 70mm;
        margin: 0 auto;
        padding: 0.5mm;
        border: none;
        text-align: center;
      }
      .header { 
        text-align: center; 
        margin-bottom: 1mm; 
        padding-bottom: 1mm;
        border-bottom: 2px double #000;
      }
      .shop-name {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 0.5mm;
        text-transform: uppercase;
      }
      .shop-details {
        font-size: 11px;
        margin-bottom: 0.3mm;
        line-height: 1;
        font-weight: bold;
      }
      .receipt-info {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
      }
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm;
        border-radius: 2px;
      }
      .items-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .item-name {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .item-details {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3mm;
        font-size: 13px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 13px;
        color: #000;
      }
      .footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #f8f8f8;
        border-top: 1px dashed #000;
      }
      .sales-person {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 2px;
      }
      .customer-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 11px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 12px;
      }
      .warning {
        font-size: 10px;
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
          size: 72mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 72mm !important;
          font-size: 13px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .receipt-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
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
        <div class="customer-field">TELEPHONE: <strong>${receiptData.customerPhone}</strong></div>
        ${
          receiptData.customerEmail
            ? `<div class="customer-field">EMAIL: <strong>${receiptData.customerEmail}</strong></div>`
            : ""
        }
      </div>
      
      <div class="receipt-title">ARTICLES ACHETES</div>
      
      <div class="items-section">
      ${receiptData.items
        .map(
          (item: CartItem) => `
        <div class="item-row">
          <div class="item-name"><strong>${item.name}</strong></div>
          <div class="item-details">
            <strong>${item.quantity}PcsX$${item.unitPrice.toFixed(2)}</strong>
          </div>
        </div>
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
      
      <div class="footer">
        <div class="thank-you"><strong>MERCI POUR VOTRE ACHAT !</strong></div>
        <div class="warning"><strong>Article non echangeable</strong></div>
        <div class="warning"><strong>Non remboursable</strong></div>
        <div class="thank-you"><strong>A BIENTOT !</strong></div>
      </div>
      
      <!-- PAPER CUT INDICATOR -->
      <div class="cut-line">
        ✄ ────────────────────────── ✄
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

  // Print function for stub only
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
        font-size: 13px;
        font-weight: bold;
        line-height: 1.1;
        width: 72mm;
        background-color: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        display: flex;
        justify-content: center;
      }
      .stub-container { 
        width: 70mm;
        margin: 0 auto;
        padding: 0.5mm;
        border: none;
        text-align: center;
      }
      .header { 
        text-align: center; 
        margin-bottom: 1mm; 
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
        font-size: 11px;
        margin-bottom: 0.3mm;
        line-height: 1;
        font-weight: bold;
      }
      .receipt-info {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #f8f8f8;
        border-left: 3px solid #000;
      }
      .receipt-title {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #000;
        color: white;
        padding: 1mm;
        border-radius: 2px;
      }
      .stub-number {
        font-size: 13px;
        font-weight: bold;
        margin: 1mm 0;
        text-transform: uppercase;
        background-color: #333;
        color: white;
        padding: 1mm 2mm;
        border-radius: 3px;
      }
      .items-section {
        margin: 1mm 0;
        padding: 1mm;
        background-color: #fafafa;
        border: 1px solid #eee;
      }
      .item-row { 
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5mm;
        padding: 0 1mm;
        border-bottom: 1px dotted #ddd;
      }
      .item-name {
        text-align: left;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .item-details {
        text-align: right;
        font-weight: bold;
        font-size: 12px;
        flex: 1;
      }
      .total-section { 
        font-weight: bold; 
        margin-top: 1mm;
        padding: 1mm;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.3mm;
        font-size: 13px;
        padding: 0 1mm;
      }
      .payment-method {
        text-transform: uppercase;
        font-weight: bold;
        font-size: 13px;
      }
      .stub-footer { 
        text-align: center; 
        margin-top: 1mm; 
        font-size: 11px;
        font-weight: bold;
        padding: 1mm;
        background-color: #e8e8e8;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      .sales-person {
        margin-top: 1mm;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        padding: 1mm;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 2px;
      }
      .customer-info {
        margin: 1mm 0;
        padding: 1mm;
        font-weight: bold;
        text-align: center;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .customer-field {
        margin-bottom: 0.3mm;
        font-size: 12px;
      }
      .separator {
        border-top: 1px dashed #000;
        margin: 1mm 0;
      }
      .cut-line {
        text-align: center;
        margin: 1mm 0;
        font-weight: bold;
        font-size: 11px;
        color: #000;
        letter-spacing: 1px;
      }
      .thank-you {
        font-weight: bold;
        margin: 0.5mm 0;
        font-size: 12px;
      }
      .warning {
        font-size: 10px;
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
          size: 72mm auto !important;
        }
        body { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 72mm !important;
          font-size: 13px !important;
          background: white !important;
          font-weight: bold !important;
          height: auto !important;
          overflow: hidden !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: flex !important;
          justify-content: center !important;
        }
        .stub-container { 
          border: none !important; 
          box-shadow: none !important; 
          margin: 0 auto !important;
          padding: 0.5mm !important;
          width: 70mm !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
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
        <div class="customer-field">TELEPHONE: <strong>${receiptData.customerPhone}</strong></div>
      </div>
      
      <div class="receipt-title">ARTICLES VENDUS</div>
      
      <div class="items-section">
      ${receiptData.items
        .map(
          (item: CartItem) => `
        <div class="item-row">
          <div class="item-name"><strong>${item.name}</strong></div>
          <div class="item-details">
            <strong>${item.quantity}PcsX$${item.unitPrice.toFixed(2)}</strong>
          </div>
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
      // Increment stub counter after both prints
      setStubCounter((prev) => prev + 1);
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
        customer: {
          name: form.customerName,
          phone: form.customerPhone,
          email: form.customerEmail || "",
        },
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        subtotal: cartTotal,
        total: cartTotal,
        paymentMethod: uiToModelPayment(form.paymentMethod),
        salesPerson: currentUser?.username || "unknown",
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

      // Enhanced receipt data with better formatting
      const currentYear = new Date().getFullYear();
      const newReceiptData = {
        shopName: "ETS. DIEU MERCI",
        shopAddress: "Av Manono Coin Munama N°39, C. Kenya, Lubumbashi",
        shopNumber: "+243 977 771 421 / +243 853 549 102",
        shopRegistration: "RCCM: 14-A-017885",
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        items: cart,
        total: cartTotal,
        paymentMethod: form.paymentMethod,
        salesPerson: currentUser?.username || "Agent",
        date: new Date().toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        receiptNumber: `DL${receiptCounter}${currentYear}`,
        stubNumber: stubCounter.toString().padStart(3, "0"),
      };

      setReceiptData(newReceiptData);

      // Reset form and cart
      setForm({
        productId: "",
        quantity: "",
        unitPrice: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        paymentMethod: form.paymentMethod,
      });
      setCart([]);

      // Increment receipt counter for next sale
      setReceiptCounter((prev) => prev + 1);

      setMessage(
        "✅ Vente effectuée avec succès ! Impression du reçu et de la souche..."
      );
    } catch (e: any) {
      setError(e?.message || "La vente n'a pas pu être effectuée");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h2 className="text-2xl font-bold mb-6 mt-6 ml-6">Nouvelle Vente</h2>

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="bg-gray-100 shadow p-6 rounded-lg max-w-4xl mb-6">
        <h3 className="text-lg font-semibold mb-4">Ajouter les articles</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block mb-1 font-medium">Articles</label>
            <select
              name="productId"
              value={form.productId}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              disabled={loadingProducts || products.length === 0}
            >
              <option value="">
                {loadingProducts ? "Loading..." : "Selectionner un article"}
              </option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}{" "}
                  {typeof p.stock === "number" ? `(Stock: ${p.stock})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Nombre de pieces</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              placeholder="Entrer le nombre de pieces"
              className="w-full p-2 border rounded"
              min={1}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Prix unitaire</label>
            <input
              type="number"
              step="0.01"
              name="unitPrice"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              placeholder={
                product?.price ? `e.g. ${product.price}` : "Entrer le prix"
              }
              className="w-full p-2 border rounded"
              min={0.01}
            />
          </div>
        </div>

        {product && typeof product.stock === "number" && (
          <p className="text-sm text-gray-600 mb-4">
            Stock disponible: <strong>{product.stock}</strong>
            {quantity > 0 && (
              <span className="ml-4">
                Stock restant après vente:{" "}
                {product.stock - quantity >= 0
                  ? product.stock - quantity
                  : "❌ pas assez de stock!"}
              </span>
            )}
          </p>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!product || quantity <= 0 || unitPrice <= 0}
          className={`px-4 py-2 rounded text-white mb-6 ${
            product && quantity > 0 && unitPrice > 0
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Ajouter au panier
        </button>

        {cart.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Articles du panier</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">
                    Articles
                  </th>
                  <th className="border border-gray-300 p-2">Pieces</th>
                  <th className="border border-gray-300 p-2">Prix unitaire</th>
                  <th className="border border-gray-300 p-2">Total</th>
                  <th className="border border-gray-300 p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">{item.name}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      ${item.total.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Enlever
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td
                    colSpan={3}
                    className="border border-gray-300 p-2 text-right font-semibold"
                  >
                    Total:
                  </td>
                  <td className="border border-gray-300 p-2 text-right font-semibold">
                    ${cartTotal.toFixed(2)}
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <h3 className="text-lg font-semibold mb-4">Informations du client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-1 font-medium">Nom du client</label>
            <input
              type="text"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              placeholder="Entrer le nom du client"
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Numero de telephone du client
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={form.customerPhone}
              onChange={handleChange}
              placeholder="Entrer le numero de telephone"
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Email du client (pas obligatoire)
            </label>
            <input
              type="email"
              name="customerEmail"
              value={form.customerEmail}
              onChange={handleChange}
              placeholder="Enter customer email"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Methode de payement
            </label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa ou Airtel Money(Transfert)</option>
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
          className={`px-4 py-2 rounded text-white ${
            isFormValid && !submitting
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "En cours d'enregistrement..." : "Enregistrer la vente"}
        </button>
      </div>

      {/* Hidden receipt container (keep as fallback) */}
      <div ref={receiptRef} style={{ display: "none" }} />
    </div>
  );
}