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

// Print service for ESC/POS printing
class PrintService {
  static async printReceipt(receiptData: any, type: 'sale' | 'reservation' = 'sale'): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/print/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ receiptData, type }),
      });

      if (!response.ok) {
        throw new Error('Failed to print receipt');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Print receipt error:', error);
      throw error;
    }
  }

  static async printStub(receiptData: any, type: 'sale' | 'reservation' = 'sale'): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/print/stub`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ receiptData, type }),
      });

      if (!response.ok) {
        throw new Error('Failed to print stub');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Print stub error:', error);
      throw error;
    }
  }

  static async printReceiptAndStub(receiptData: any, type: 'sale' | 'reservation' = 'sale'): Promise<boolean> {
    try {
      // Print receipt first
      await this.printReceipt(receiptData, type);
      
      // Small delay between prints
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Print stub
      await this.printStub(receiptData, type);
      
      return true;
    } catch (error) {
      console.error('Print receipt and stub error:', error);
      throw error;
    }
  }
}

export default function Reservation() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [stubCounter, setStubCounter] = useState(1);

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
    notes: "",
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleAddToCart() {
    if (!product || quantity <= 0 || unitPrice <= 0) return;

    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(
      (item) => item.productId === product._id
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + quantity,
        total: (updatedCart[existingItemIndex].quantity + quantity) * unitPrice,
      };
      setCart(updatedCart);
    } else {
      // Add new item
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

  // Keep the old print function as fallback
  const printReceiptAndStub = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank", "width=800,height=800");
      if (printWindow) {
        printWindow.document.write(`
  <html>
    <head>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          margin: 0; 
          padding: 2mm; 
          font-size: 10px;
          width: 88mm;
        }
        .receipt, .stub { 
          width: 100%;
          margin: 0;
          padding: 1mm;
          border: none;
        }
        .stub { 
          page-break-before: always;
          margin-top: 5mm;
        }
        .header { 
          text-align: center; 
          margin-bottom: 2mm; 
          border-bottom: 1px solid #000; 
          padding-bottom: 1mm;
        }
        .item { 
          display: block; 
          margin-bottom: 1mm; 
          clear: both;
        }
        .item span:first-child { 
          float: left; 
          text-align: left;
        }
        .item span:last-child { 
          float: right; 
          text-align: right;
        }
        .total { 
          font-weight: bold; 
          border-top: 1px solid #000; 
          padding-top: 2mm; 
          margin-top: 2mm;
          clear: both;
        }
        .footer, .stub-footer { 
          text-align: center; 
          margin-top: 3mm; 
          font-size: 9px; 
        }
        .stub-footer { 
          border-top: 1px dashed #000;
          padding-top: 2mm;
        }
        .sales-person {
          margin-top: 2mm;
          text-align: center;
          font-style: italic;
        }
        .stub-number {
          font-weight: bold;
          text-align: center;
          margin-top: 2mm;
          font-size: 11px;
        }
        .clear { 
          clear: both; 
        }
        @media print {
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 88mm !important;
          }
          .receipt, .stub { 
            border: none !important; 
            box-shadow: none !important; 
            margin: 0 !important;
            padding: 1mm !important;
          }
          .stub { 
            margin-top: 5mm !important;
          }
        }
      </style>
    </head>
    <body onload="window.print(); window.onafterprint = function() { window.close(); }">
      <!-- RECEIPT -->
      <div class="receipt">
        <div class="header">
          <h3 style="margin: 1mm 0; font-size: 12px;">${
            receiptData.shopName
          }</h3>
          <p style="margin: 1mm 0;"><strong>_Chez Dan Collection_</strong></p>
          <p style="margin: 1mm 0; font-size: 9px;">${
            receiptData.shopAddress
          }</p>
          <p style="margin: 1mm 0; font-size: 9px;">${
            receiptData.shopRegistration
          }</p>
          <p style="margin: 1mm 0; font-size: 9px;">${
            receiptData.shopNumber
          }</p>
          <p style="margin: 1mm 0;">Date: ${receiptData.date}</p>
          <p style="margin: 1mm 0;">Reçu #: ${receiptData.receiptNumber}</p>
        </div>
        
        <div class="customer">
          <p style="margin: 1mm 0;"><strong>Client:</strong> ${
            receiptData.customerName
          }</p>
          <p style="margin: 1mm 0;"><strong>Tél:</strong> ${
            receiptData.customerPhone
          }</p>
          ${
            receiptData.customerEmail
              ? `<p style="margin: 1mm 0;"><strong>Email:</strong> ${receiptData.customerEmail}</p>`
              : ""
          }
        </div>
        
        <p style="margin: 2mm 0 1mm 0;"><strong>Articles:</strong></p>
        ${receiptData.items
          .map(
            (item: CartItem) => `
          <div class="item">
            <span>${item.quantity}x ${item.name}</span>
            <span>$${item.total.toFixed(2)}</span>
          </div>
          <div class="clear"></div>
        `
          )
          .join("")}
        
        <div class="total">
          <div class="item">
            <span>Total:</span>
            <span>$${receiptData.total.toFixed(2)}</span>
          </div>
          <div class="clear"></div>
          <div class="item">
            <span>Paiement:</span>
            <span>${receiptData.paymentMethod.toUpperCase()}</span>
          </div>
          <div class="clear"></div>
        </div>
        
        <div class="sales-person">
          <p>Agent: ${receiptData.salesPerson}</p>
        </div>
        
        <div class="footer">
          <p>✅ Reservation confirmée !</p>
          <p>Merci pour votre reservation !</p>
        </div>
      </div>

      <!-- SALE STUB -->
      <div class="stub">
        <div class="header">
          <h3 style="margin: 1mm 0; font-size: 12px;">${
            receiptData.shopName
          }</h3>
          <p style="margin: 1mm 0;"><strong>_Chez Dan Collection_</strong></p>
          <p style="margin: 1mm 0; font-size: 9px;">${
            receiptData.shopAddress
          }</p>
          <p style="margin: 1mm 0; font-size: 9px;">${
            receiptData.shopRegistration
          }</p>
          <p style="margin: 1mm 0; font-size: 9px;">${
            receiptData.shopNumber
          }</p>
          <p style="margin: 1mm 0;">Date: ${receiptData.date}</p>
          <p style="margin: 1mm 0;">Reçu #: ${receiptData.receiptNumber}</p>
        </div>
        
        <div class="customer">
          <p style="margin: 1mm 0;"><strong>Client:</strong> ${
            receiptData.customerName
          }</p>
          <p style="margin: 1mm 0;"><strong>Tél:</strong> ${
            receiptData.customerPhone
          }</p>
          ${
            receiptData.customerEmail
              ? `<p style="margin: 1mm 0;"><strong>Email:</strong> ${receiptData.customerEmail}</p>`
              : ""
          }
        </div>
        
        <p style="margin: 2mm 0 1mm 0;"><strong>Articles:</strong></p>
        ${receiptData.items
          .map(
            (item: CartItem) => `
          <div class="item">
            <span>${item.quantity}x ${item.name}</span>
            <span>$${item.total.toFixed(2)}</span>
          </div>
          <div class="clear"></div>
        `
          )
          .join("")}
        
        <div class="total">
          <div class="item">
            <span>Total:</span>
            <span>$${receiptData.total.toFixed(2)}</span>
          </div>
          <div class="clear"></div>
          <div class="item">
            <span>Paiement:</span>
            <span>${receiptData.paymentMethod.toUpperCase()}</span>
          </div>
          <div class="clear"></div>
        </div>
        
        <div class="sales-person">
          <p>Agent: ${receiptData.salesPerson}</p>
        </div>
        
        <div class="stub-footer">
          <div class="stub-number">
            SOUCHE N°${receiptData.stubNumber} DU JOUR
          </div>
          <p>✅ Reservation confirmée !</p>
        </div>
      </div>
    </body>
  </html>
`);
        printWindow.document.close();
      }
    }
  };

  // New ESC/POS printing function
  const printWithESCPOS = async (receiptData: any) => {
    try {
      await PrintService.printReceiptAndStub(receiptData, 'reservation');
      return true;
    } catch (error: any) {
      console.error('ESC/POS printing failed, falling back to browser printing:', error);
      // Fallback to browser printing
      printReceiptAndStub();
      return false;
    }
  };

  useEffect(() => {
    if (receiptData) {
      // Small delay to ensure the receipt data is set
      const timer = setTimeout(async () => {
        try {
          // Try ESC/POS printing first, fallback to browser printing
          await printWithESCPOS(receiptData);
          // Increment stub counter for next sale
          setStubCounter((prev) => prev + 1);
        } catch (error) {
          console.error('Printing failed:', error);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [receiptData]);

  async function handleReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      // Get current date and time for reservation
      const now = new Date();
      const reservationDate = now.toLocaleDateString("fr-FR");
      const reservationTime = now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });

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
        reservationDate: reservationDate,
        reservationTime: reservationTime,
        notes: form.notes || "",
        type: "reservation", // Add type to distinguish from sales
      };

      // Use the same /sales endpoint as NewSale.tsx
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
          `Reservation failed (${res.status})`;
        throw new Error(msg);
      }

      // Prepare receipt data
      const newReceiptData = {
        shopName: "ETS. DIEU MERCI",
        shopAddress: "Av Manono Coin Munama N°39,C.Kenya, Lubumbashi",
        shopNumber: "+243 977 771 421 / +243 853 549 102",
        shopRegistration: "RCCM: 14-A-017885",
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        items: cart,
        total: cartTotal,
        paymentMethod: form.paymentMethod,
        salesPerson: currentUser?.username || "Vendeur",
        date: new Date().toLocaleString(),
        receiptNumber: Math.floor(100000 + Math.random() * 900000),
        stubNumber: stubCounter,
        reservationDate: reservationDate,
        reservationTime: reservationTime,
        notes: form.notes,
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
        notes: "",
      });
      setCart([]);

      setMessage(
        "✅ Reservation effectuée avec succès ! Impression du reçu et de la souche..."
      );
      setSubmitting(false);
    } catch (e: any) {
      setError(e?.message || "La reservation n'a pas pu être effectuée");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h2 className="text-2xl font-bold mb-6 mt-6 ml-6">
        Nouvelle Reservation
      </h2>

      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="bg-gray-100 shadow p-6 rounded-lg max-w-4xl mb-6">
        <h3 className="text-lg font-semibold mb-4">
          Ajouter les articles à réserver
        </h3>

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
                Stock restant après reservation:{" "}
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
            <h3 className="text-lg font-semibold mb-2">
              Articles du panier de reservation
            </h3>
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

        <div className="mb-6">
          <label className="block mb-1 font-medium">
            Notes (pas obligatoire)
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Notes supplémentaires pour la reservation"
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>

        <button
          type="submit"
          onClick={handleReservation}
          disabled={!isFormValid || submitting}
          className={`px-4 py-2 rounded text-white ${
            isFormValid && !submitting
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {submitting
            ? "En cours d'enregistrement..."
            : "Confirmer la Reservation"}
        </button>
      </div>

      {/* Hidden receipt container (keep as fallback) */}
      <div ref={receiptRef} style={{ display: "none" }} />
    </div>
  );
}