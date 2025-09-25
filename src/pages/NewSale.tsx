/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState, useRef } from "react";
// Update the import path to the correct location of useAuth
import { useAuth } from "../hooks/useAuth"; // Import your useAuth hook

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

export default function NewSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

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

    // Reset form fields
    setForm((f) => ({
      ...f,
      quantity: "",
      unitPrice: product.price ? product.price.toString() : "",
    }));
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

  const printReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Reçu</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px; 
                  background-color: #fff;
                }
                .receipt { 
                  max-width: 300px; 
                  margin: 0 auto; 
                  border: 1px solid #ccc; 
                  padding: 15px; 
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 15px; 
                  border-bottom: 1px solid #eee; 
                  padding-bottom: 10px;
                }
                .item { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 5px; 
                }
                .total { 
                  font-weight: bold; 
                  border-top: 1px solid #000; 
                  padding-top: 10px; 
                  margin-top: 10px;
                }
                .footer { 
                  text-align: center; 
                  margin-top: 20px; 
                  font-size: 0.9em; 
                  color: #666;
                }
                .sales-person {
                  margin-top: 10px;
                  font-style: italic;
                  text-align: center;
                }
                @media print {
                  body { margin: 0; padding: 15px; }
                  .receipt { box-shadow: none; border: none; }
                }
              </style>
            </head>
            <body onload="window.print(); window.onafterprint = function() { window.close(); }">
              <div class="receipt">
                <div class="header">
                  <h2>${receiptData.shopName}</h2>
                  <p>${receiptData.shopAddress}</p>
                  <p>Téléphone:</p>
                  <p>${receiptData.shopNumber}</p>
                  <p>Date: ${receiptData.date}</p>
                  <p>Reçu #: ${receiptData.receiptNumber}</p>
                </div>
                
                <div class="customer">
                  <h3>Details du client</h3>
                  <p>Nom: ${receiptData.customerName}</p>
                  <p>Numéro de téléphone: ${receiptData.customerPhone}</p>
                  ${
                    receiptData.customerEmail
                      ? `<p>Email: ${receiptData.customerEmail}</p>`
                      : ""
                  }
                </div>
                
                <h3>Articles</h3>
                ${receiptData.items
                  .map(
                    (item: CartItem) => `
                  <div class="item">
                    <span>${item.quantity} x ${item.name}</span>
                    <span>$${item.total.toFixed(2)}</span>
                  </div>
                `
                  )
                  .join("")}
                
                <div class="total">
                  <div class="item">
                    <span>Total:</span>
                    <span>$${receiptData.total.toFixed(2)}</span>
                  </div>
                  <div class="item">
                    <span>Methode de payement:</span>
                    <span>${receiptData.paymentMethod.toUpperCase()}</span>
                  </div>
                </div>
                
                <div class="sales-person">
                  <p>Agent: ${receiptData.salesPerson}</p>
                </div>
                
                <div class="footer">
                  <p>Merci pour votre achat ! ✅</p>
                  <p>À bientôt!✅ </p>
                </div>
              </div>
            </body>
          </html>
        `);

        printWindow.document.close();
      }
    }
  };

  useEffect(() => {
    if (receiptData) {
      // Small delay to ensure the receipt data is set
      const timer = setTimeout(() => {
        printReceipt();
      }, 100);

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
        salesPerson: currentUser?.username || "unknown", // Include sales person username in the request
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

      // Prepare receipt data
      setReceiptData({
        shopName: "ETS. DIEU MERCI",
        shopAddress: "Av Manono Coin Munama N°39,C.Kenya, Lubumbashi",
        shopNumber: "+243 977 771 421 / +243 853 549 102",
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        items: cart,
        total: cartTotal,
        paymentMethod: form.paymentMethod,
        salesPerson: currentUser?.username || "Vendeur", // Use username or fallback
        date: new Date().toLocaleString(),
        receiptNumber: Math.floor(100000 + Math.random() * 900000),
      });

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

      setMessage("✅ Vente effectuée avec succès ! Impression du reçu...");
      setSubmitting(false);
    } catch (e: any) {
      setError(e?.message || "La vente n’a pas pu être effectuée");
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
              onChange={handleChange}
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
                        Remove
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

      {/* Hidden receipt container */}
      <div ref={receiptRef} style={{ display: "none" }} />
    </div>
  );
}
